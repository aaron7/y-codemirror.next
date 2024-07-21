export function yCollab(ytext: Y.Text, awareness: any, { undoManager }?: {
    undoManager?: Y.UndoManager | false;
}): cmState.Extension;
import { YRange } from './y-range.js';
import { yRemoteSelections } from './y-remote-selections.js';
import { yRemoteSelectionsTheme } from './y-remote-selections.js';
import { ySync } from './y-sync.js';
import { ySyncFacet } from './y-sync.js';
import { YSyncConfig } from './y-sync.js';
import { ySyncAnnotation } from './y-sync.js';
import { yUndoManagerKeymap } from './y-undomanager.js';
import * as Y from 'yjs';
import * as cmState from '@codemirror/state';
export { YRange, yRemoteSelections, yRemoteSelectionsTheme, ySync, ySyncFacet, YSyncConfig, ySyncAnnotation, yUndoManagerKeymap };