/**
 * ChoiceMap Shared Utilities
 * Common functions used across scenario-editor, navigator, and theme-editor
 */

(function(global) {
    'use strict';

    // ============================================================
    // CONSTANTS
    // ============================================================

    const RESOURCE_TYPES = {
        LINK: 'link',
        DOWNLOAD: 'download',
        VIDEO: 'video'
    };

    const RESOURCE_ICONS = {
        link: '🔗',
        download: '📥',
        video: '▶️'
    };

    const RESOURCE_LABELS = {
        link: 'Open',
        download: 'Download',
        video: 'Watch'
    };

    // ============================================================
    // INPUT SANITIZATION
    // ============================================================

    /**
     * Sanitize a URL to prevent XSS attacks
     * @param {string} url - The URL to sanitize
     * @returns {string} - Sanitized URL or empty string if invalid
     */
    function sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '';

        const trimmed = url.trim();

        // Block javascript: and data: URLs (except safe data: images)
        const lowerUrl = trimmed.toLowerCase();
        if (lowerUrl.startsWith('javascript:')) return '';
        if (lowerUrl.startsWith('data:') && !lowerUrl.startsWith('data:image/')) return '';

        // Allow http, https, mailto, tel, and relative URLs
        if (trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('mailto:') ||
            trimmed.startsWith('tel:') ||
            trimmed.startsWith('/') ||
            trimmed.startsWith('./') ||
            trimmed.startsWith('../') ||
            !trimmed.includes(':')) {
            return trimmed;
        }

        // Block other protocols
        return '';
    }

    /**
     * Sanitize a node ID to contain only safe characters
     * @param {string} id - The node ID to sanitize
     * @returns {string} - Sanitized ID with only alphanumeric and underscores
     */
    function sanitizeNodeId(id) {
        if (!id || typeof id !== 'string') return '';
        return id.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} str - The string to escape
     * @returns {string} - HTML-escaped string
     */
    function escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
    }

    // ============================================================
    // NODE LEVEL CALCULATIONS
    // ============================================================

    /**
     * Calculate node levels using BFS traversal from start node
     * @param {Object} nodes - Map of nodeId to node data
     * @param {string} startNode - ID of the starting node
     * @returns {Object} - Map of level number to array of node IDs
     */
    function calculateNodeLevels(nodes, startNode) {
        const levels = {};
        const visited = new Set();
        const queue = [{ id: startNode, level: 1 }];
        let qi = 0;

        while (qi < queue.length) {
            const { id, level } = queue[qi++];
            if (visited.has(id) || !nodes[id]) continue;

            visited.add(id);
            if (!levels[level]) levels[level] = [];
            levels[level].push(id);

            (nodes[id].choices || []).forEach(choice => {
                if (choice.next && !visited.has(choice.next)) {
                    queue.push({ id: choice.next, level: level + 1 });
                }
            });
        }

        // Add orphan nodes at level 0
        Object.keys(nodes).forEach(id => {
            if (!visited.has(id)) {
                if (!levels[0]) levels[0] = [];
                levels[0].push(id);
            }
        });

        return levels;
    }

    /**
     * Get effective level for a node (explicit level takes priority over calculated)
     * @param {string} nodeId - The node ID
     * @param {Object} nodes - Map of nodeId to node data
     * @param {string} startNode - ID of the starting node
     * @param {Object} [levelsMap] - Pre-calculated levels from calculateNodeLevels (avoids redundant BFS)
     * @returns {number} - The effective level (0 for orphans)
     */
    function getEffectiveLevel(nodeId, nodes, startNode, levelsMap) {
        // If node has explicit level, use it
        if (nodes[nodeId]?.level !== undefined &&
            nodes[nodeId]?.level !== null &&
            nodes[nodeId]?.level !== '') {
            return parseInt(nodes[nodeId].level);
        }

        // Use pre-calculated levels if provided, otherwise calculate via BFS
        const levels = levelsMap || calculateNodeLevels(nodes, startNode);
        for (const [level, nodeIds] of Object.entries(levels)) {
            if (nodeIds.includes(nodeId)) return parseInt(level);
        }

        return 0; // orphan
    }

    /**
     * Get node level and position among nodes at same level
     * @param {string} nodeId - The node ID
     * @param {Object} nodes - Map of nodeId to node data
     * @param {string} startNode - ID of the starting node
     * @returns {Object} - { level: number, position: number }
     */
    function getNodeLevel(nodeId, nodes, startNode, levelsMap) {
        if (levelsMap) {
            // Direct lookup from pre-calculated levels map
            for (const [level, nodeIds] of Object.entries(levelsMap)) {
                const idx = nodeIds.indexOf(nodeId);
                if (idx !== -1) return { level: parseInt(level), position: idx + 1 };
            }
            return { level: 0, position: 1 };
        }

        // Calculate BFS levels once to avoid N redundant BFS traversals
        const calculatedLevels = calculateNodeLevels(nodes, startNode);
        const effectiveLevel = getEffectiveLevel(nodeId, nodes, startNode, calculatedLevels);

        // Calculate position among nodes at same effective level
        const nodesAtSameLevel = Object.keys(nodes).filter(
            id => getEffectiveLevel(id, nodes, startNode, calculatedLevels) === effectiveLevel
        );
        const position = nodesAtSameLevel.indexOf(nodeId) + 1;

        return { level: effectiveLevel, position };
    }

    /**
     * Calculate automatic positions for nodes based on their levels
     * Uses effective level (explicit or calculated) for vertical positioning
     * @param {Object} nodes - Map of nodeId to node data
     * @param {string} startNode - ID of the starting node
     * @param {Object} layoutConfig - Layout configuration (optional)
     * @returns {Object} - { positions: Map<nodeId, {x,y}>, maxWidth: number, maxLevel: number }
     */
    function calculateAutoPositions(nodes, startNode, layoutConfig) {
        const config = layoutConfig || {
            levelHeight: 120,
            nodeWidth: 140,
            nodeHeight: 44,
            padding: 60
        };

        const { levelHeight, nodeWidth, padding } = config;
        const positions = {};

        // Calculate BFS levels once, reuse for all nodes
        const levelsMap = calculateNodeLevels(nodes, startNode);

        // Group nodes by their effective level
        const levelGroups = {};
        Object.keys(nodes).forEach(nodeId => {
            const effectiveLevel = getEffectiveLevel(nodeId, nodes, startNode, levelsMap);
            if (!levelGroups[effectiveLevel]) levelGroups[effectiveLevel] = [];
            levelGroups[effectiveLevel].push(nodeId);
        });

        const maxLevel = Math.max(...Object.keys(levelGroups).map(Number), 1);

        // Calculate max width needed
        let maxWidth = 0;
        Object.values(levelGroups).forEach(nodeIds => {
            maxWidth = Math.max(maxWidth, nodeIds.length * nodeWidth);
        });

        // Position nodes by their effective level
        Object.entries(levelGroups).forEach(([level, nodeIds]) => {
            const totalWidth = nodeIds.length * nodeWidth;
            const startX = (maxWidth - totalWidth) / 2 + nodeWidth / 2;
            nodeIds.forEach((nodeId, index) => {
                positions[nodeId] = {
                    x: startX + index * nodeWidth + padding,
                    y: parseInt(level) * levelHeight + padding
                };
            });
        });

        return { positions, maxWidth, maxLevel };
    }

    // ============================================================
    // MAP CONNECTION UTILITIES
    // ============================================================

    /**
     * Generate SVG path for a connection between two nodes
     * @param {Object} conn - Connection object with from, to, isLoop, isSameLevel
     * @param {number} nodeHeight - Height of nodes in the map
     * @returns {Object} - { path, type, x1, y1, x2, y2, [cx, cy] }
     */
    function getConnectionPath(conn, nodeHeight) {
        const x1 = conn.from.x;
        const y1 = conn.from.y + nodeHeight / 2;
        const x2 = conn.to.x;
        const y2 = conn.to.y - nodeHeight / 2;

        // Forward connection - straight line
        if (!conn.isLoop && !conn.isSameLevel) {
            return { path: 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2, type: 'line', x1: x1, y1: y1, x2: x2, y2: y2 };
        }

        // Loop or same level - curved arc
        var midX = (x1 + x2) / 2;
        var midY = (y1 + y2) / 2;
        var visuallyBackward = conn.to.y < conn.from.y;
        var curveOffset = conn.isLoop
            ? Math.max(80, Math.abs(conn.from.y - conn.to.y) * 0.3 + 60)
            : 50;
        var curveDirection = x1 <= x2 ? 1 : -1;
        var controlX = midX + (curveOffset * curveDirection * (conn.isLoop ? 1.5 : 1));
        var controlY = visuallyBackward ? Math.min(y1, y2) - 30 : midY;

        return { path: 'M ' + x1 + ' ' + y1 + ' Q ' + controlX + ' ' + controlY + ' ' + x2 + ' ' + y2, type: 'bezier', x1: x1, y1: y1, x2: x2, y2: y2, cx: controlX, cy: controlY };
    }

    /**
     * Calculate midpoint and angle for arrow placement on a path
     * @param {Object} pathData - Path data from getConnectionPath
     * @returns {Object} - { x, y, angle }
     */
    function getArrowPosition(pathData) {
        if (pathData.type === 'line') {
            var mx = (pathData.x1 + pathData.x2) / 2;
            var my = (pathData.y1 + pathData.y2) / 2;
            return { x: mx, y: my, angle: Math.atan2(pathData.y2 - pathData.y1, pathData.x2 - pathData.x1) * 180 / Math.PI };
        }
        var t = 0.5;
        var bx = (1 - t) * (1 - t) * pathData.x1 + 2 * (1 - t) * t * pathData.cx + t * t * pathData.x2;
        var by = (1 - t) * (1 - t) * pathData.y1 + 2 * (1 - t) * t * pathData.cy + t * t * pathData.y2;
        var tx = 2 * (1 - t) * (pathData.cx - pathData.x1) + 2 * t * (pathData.x2 - pathData.cx);
        var ty = 2 * (1 - t) * (pathData.cy - pathData.y1) + 2 * t * (pathData.y2 - pathData.cy);
        return { x: bx, y: by, angle: Math.atan2(ty, tx) * 180 / Math.PI };
    }

    /**
     * Get connection color based on structure (loop, same level, forward)
     * @param {Object} conn - Connection with isLoop, isSameLevel, visited flags
     * @returns {string} - CSS color value
     */
    function getConnectionColor(conn) {
        if (conn.isLoop) return '#f59e0b';
        if (conn.isSameLevel) return '#8b5cf6';
        if (conn.visited) return 'var(--map-line-visited)';
        return '#d1d5db';
    }

    // ============================================================
    // ERROR BOUNDARY COMPONENT
    // ============================================================

    /**
     * ErrorBoundary React component for catching render errors
     * Usage: <ErrorBoundary><YourComponent /></ErrorBoundary>
     */
    class ErrorBoundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = { hasError: false, error: null, errorInfo: null };
        }

        static getDerivedStateFromError(error) {
            return { hasError: true, error };
        }

        componentDidCatch(error, errorInfo) {
            this.setState({ errorInfo });
            // Log error for debugging
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        handleRetry = () => {
            this.setState({ hasError: false, error: null, errorInfo: null });
        };

        render() {
            if (this.state.hasError) {
                return React.createElement('div', { className: 'error-boundary' },
                    React.createElement('div', { className: 'error-boundary-icon' }, '⚠️'),
                    React.createElement('h2', { className: 'error-boundary-title' }, 'Something went wrong'),
                    React.createElement('p', { className: 'error-boundary-message' },
                        this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'
                    ),
                    this.state.error && React.createElement('details', { className: 'error-boundary-details' },
                        React.createElement('summary', null, 'Error details'),
                        React.createElement('pre', null, this.state.error.toString()),
                        this.state.errorInfo && React.createElement('pre', null,
                            this.state.errorInfo.componentStack
                        )
                    ),
                    React.createElement('button', {
                        className: 'btn btn-primary error-boundary-retry',
                        onClick: this.handleRetry
                    }, 'Try Again')
                );
            }

            return this.props.children;
        }
    }

    // ============================================================
    // EXPORT TO GLOBAL
    // ============================================================

    global.ChoiceMapUtils = {
        // Constants
        RESOURCE_TYPES,
        RESOURCE_ICONS,
        RESOURCE_LABELS,

        // Sanitization
        sanitizeUrl,
        sanitizeNodeId,
        escapeHtml,

        // Node calculations
        calculateNodeLevels,
        getEffectiveLevel,
        getNodeLevel,
        calculateAutoPositions,

        // Map connection utilities
        getConnectionPath,
        getArrowPosition,
        getConnectionColor,

        // Components
        ErrorBoundary
    };

})(typeof window !== 'undefined' ? window : this);
