# Resources Folder

This folder contains downloadable resources referenced in your scenarios.

## Usage

Place files here that your scenarios reference, such as:
- PDF documents
- Templates
- Guides
- Supplementary materials

## Example

In your scenario JSON, reference files like this:

```json
{
    "type": "download",
    "label": "Analysis Template",
    "url": "docs/analysis-template.pdf"
}
```

The `url` path is relative to the navigator HTML file.
