export const yRemoteSelectionsTheme: cmState.Extension;
export class YRemoteSelectionsPluginValue {
    /**
     * @param {cmView.EditorView} view
     */
    constructor(view: cmView.EditorView);
    conf: import("./y-sync.js").YSyncConfig;
    _listener: ({ added, updated, removed }: {
        added: any;
        updated: any;
        removed: any;
    }, s: any, t: any) => void;
    _awareness: any;
    /**
     * @type {cmView.DecorationSet}
     */
    decorations: cmView.DecorationSet;
    destroy(): void;
    /**
     * @param {cmView.ViewUpdate} update
     */
    update(update: cmView.ViewUpdate): void;
}
export const yRemoteSelections: cmView.ViewPlugin<YRemoteSelectionsPluginValue>;
/**
 * A RectangleMarker that draws a cursor for a remote selection.
 */
export class SelectionCaretRectangleMarker {
    /**
     * @param {cmView.EditorView} view
     * @param {string} className
     * @param {string} color
     * @param {string} name
     * @param {number} head
     * @returns {SelectionCaretRectangleMarker}
     */
    static forRemoteCursor(view: cmView.EditorView, className: string, color: string, name: string, head: number): SelectionCaretRectangleMarker;
    /**
     * @param {string} className
     * @param {object} style
     * @param {string} name
     * @param {number} left
     * @param {number} top
     * @param {number | null} width
     * @param {number} height
     */
    constructor(className: string, style: object, name: string, left: number, top: number, width: number | null, height: number);
    className: string;
    style: any;
    name: string;
    left: number;
    top: number;
    width: number;
    height: number;
    draw(): HTMLDivElement;
    /**
     * @param {HTMLElement} elt
     * @param {SelectionCaretRectangleMarker} prev
     */
    update(elt: HTMLElement, prev: SelectionCaretRectangleMarker): boolean;
    /**
     * @param {HTMLElement} elt
     */
    adjust(elt: HTMLElement): void;
    /**
     * @param {SelectionCaretRectangleMarker} p
     */
    eq(p: SelectionCaretRectangleMarker): boolean;
}
export const yRemoteSelectionsLayer: cmState.Extension;
export const yRemoteCursorsLayer: cmState.Extension;
import * as cmState from '@codemirror/state';
import * as cmView from '@codemirror/view';
