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

        while (queue.length > 0) {
            const { id, level } = queue.shift();
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
     * @returns {number} - The effective level (0 for orphans)
     */
    function getEffectiveLevel(nodeId, nodes, startNode) {
        // If node has explicit level, use it
        if (nodes[nodeId]?.level !== undefined &&
            nodes[nodeId]?.level !== null &&
            nodes[nodeId]?.level !== '') {
            return parseInt(nodes[nodeId].level);
        }

        // Otherwise calculate via BFS
        const levels = calculateNodeLevels(nodes, startNode);
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
    function getNodeLevel(nodeId, nodes, startNode) {
        const effectiveLevel = getEffectiveLevel(nodeId, nodes, startNode);

        // Calculate position among nodes at same effective level
        const nodesAtSameLevel = Object.keys(nodes).filter(
            id => getEffectiveLevel(id, nodes, startNode) === effectiveLevel
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

        // Group nodes by their effective level
        const levelGroups = {};
        Object.keys(nodes).forEach(nodeId => {
            const effectiveLevel = getEffectiveLevel(nodeId, nodes, startNode);
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

        // Components
        ErrorBoundary
    };

})(typeof window !== 'undefined' ? window : this);
