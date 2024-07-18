
import * as cmView from '@codemirror/view'

import * as cmState from '@codemirror/state'
import * as object from 'lib0/object'

import * as Y from 'yjs'
import { ySyncFacet } from './y-sync.js'

export const yRemoteSelectionsTheme = cmView.EditorView.baseTheme({
  '.cm-ySelection': {
  },
  '.cm-yLineSelection': {
    padding: 0,
    margin: '0px 2px 0px 4px'
  },
  '.cm-ySelectionCaret': {
    position: 'absolute',
    borderLeft: '1px solid black',
    borderRight: '1px solid black',
    marginLeft: '-1px',
    marginRight: '-1px',
    boxSizing: 'border-box'
  },
  '.cm-ySelectionCaretDot': {
    borderRadius: '50%',
    position: 'absolute',
    width: '.4em',
    height: '.4em',
    top: '-.2em',
    left: '-.2em',
    backgroundColor: 'inherit',
    transition: 'transform .3s ease-in-out',
    boxSizing: 'border-box'
  },
  '.cm-ySelectionCaret:hover > .cm-ySelectionCaretDot': {
    transformOrigin: 'bottom center',
    transform: 'scale(0)'
  },
  '.cm-ySelectionInfo': {
    position: 'absolute',
    top: '-1.05em',
    left: '-1px',
    fontSize: '.75em',
    fontFamily: 'serif',
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 'normal',
    userSelect: 'none',
    color: 'white',
    padding: '2px 5px',
    zIndex: 101,
    transition: 'opacity .3s ease-in-out',
    backgroundColor: 'inherit',
    borderRadius: '5px',
    // these should be separate
    opacity: 0,
    transitionDelay: '0s',
    whiteSpace: 'nowrap'
  },
  '.cm-ySelectionCaret:hover > .cm-ySelectionInfo': {
    opacity: 1,
    transitionDelay: '0s'
  }
})

/**
 * @todo specify the users that actually changed. Currently, we recalculate positions for every user.
 * @type {cmState.AnnotationType<Array<number>>}
 */
const yRemoteSelectionsAnnotation = cmState.Annotation.define()

export class YRemoteSelectionsPluginValue {
  /**
   * @param {cmView.EditorView} view
   */
  constructor (view) {
    this.conf = view.state.facet(ySyncFacet)
    this._listener = ({ added, updated, removed }, s, t) => {
      const clients = added.concat(updated).concat(removed)
      if (clients.findIndex(id => id !== this.conf.awareness.doc.clientID) >= 0) {
        view.dispatch({ annotations: [yRemoteSelectionsAnnotation.of([])] })
      }
    }
    this._awareness = this.conf.awareness
    this._awareness.on('change', this._listener)
    /**
     * @type {cmView.DecorationSet}
     */
    this.decorations = cmState.RangeSet.of([])
  }

  destroy () {
    this._awareness.off('change', this._listener)
  }

  /**
   * @param {cmView.ViewUpdate} update
   */
  update (update) {
    const ytext = this.conf.ytext
    const awareness = this.conf.awareness
    const localAwarenessState = this.conf.awareness.getLocalState()

    // set local awareness state (update cursors)
    if (localAwarenessState != null) {
      const hasFocus = update.view.hasFocus && update.view.dom.ownerDocument.hasFocus()
      const sel = hasFocus ? update.state.selection.main : null
      const currentAnchor = localAwarenessState.cursor == null ? null : Y.createRelativePositionFromJSON(localAwarenessState.cursor.anchor)
      const currentHead = localAwarenessState.cursor == null ? null : Y.createRelativePositionFromJSON(localAwarenessState.cursor.head)

      if (sel != null) {
        const anchor = Y.createRelativePositionFromTypeIndex(ytext, sel.anchor)
        const head = Y.createRelativePositionFromTypeIndex(ytext, sel.head)
        if (localAwarenessState.cursor == null || !Y.compareRelativePositions(currentAnchor, anchor) || !Y.compareRelativePositions(currentHead, head)) {
          awareness.setLocalStateField('cursor', {
            anchor,
            head
          })
        }
      } else if (localAwarenessState.cursor != null && hasFocus) {
        awareness.setLocalStateField('cursor', null)
      }
    }
  }
}

export const yRemoteSelections = cmView.ViewPlugin.fromClass(YRemoteSelectionsPluginValue)

/**
 * An extended RectangleMarker that can be styled dynamically. Used to
 * style remote selections with the user's color.
 */
class StyledRectangleMarker extends cmView.RectangleMarker {
  /**
   * @param {string} className
   * @param {object} style
   * @param {number} left
   * @param {number} top
   * @param {number} width
   * @param {number} height
   */
  constructor (className, style, left, top, width, height) {
    super(className, left, top, width, height)
    this.style = style
  }

  draw () {
    const elt = super.draw()
    for (const key in this.style) {
      elt.style[key] = this.style[key]
    }
    return elt
  }

  /**
   * @param {cmView.EditorView} view
   * @param {string} className
   * @param {object} style
   * @param {cmState.SelectionRange} range
   */
  static forRangeWithStyle (view, className, style, range) {
    const rectangles = super.forRange(view, className, range)

    return rectangles.map(
      (rect) =>
        new StyledRectangleMarker(
          className,
          style,
          rect.left,
          rect.top,
          rect.width,
          rect.height
        )
    )
  }
}

/**
 * @param {cmView.EditorView} view
 */
function getBase (view) {
  const rect = view.scrollDOM.getBoundingClientRect()
  const left =
    view.textDirection === 0
      ? rect.left
      : rect.right - view.scrollDOM.clientWidth * view.scaleX
  return {
    left: left - view.scrollDOM.scrollLeft * view.scaleX,
    top: rect.top - view.scrollDOM.scrollTop * view.scaleY
  }
}

/**
 * A RectangleMarker that draws a cursor for a remote selection.
 */
export class SelectionCaretRectangleMarker {
  /**
   * @param {string} className
   * @param {object} style
   * @param {string} name
   * @param {number} left
   * @param {number} top
   * @param {number | null} width
   * @param {number} height
   */
  constructor (
    className,
    style,
    name,
    left,
    top,
    width,
    height
  ) {
    this.className = className
    this.style = style
    this.name = name
    this.left = left
    this.top = top
    this.width = width
    this.height = height
  }

  draw () {
    // This element is copied from original y.js remote selection
    // implementation, but given this is no longer a decoration we could update
    // it's implementation.
    const elt = document.createElement('div')
    elt.className = this.className
    for (const key in this.style) {
      elt.style[key] = this.style[key]
    }

    elt.appendChild(document.createTextNode('\u2060'))

    const dot = document.createElement('div')
    dot.className = 'cm-ySelectionCaretDot'
    elt.appendChild(dot)

    elt.appendChild(document.createTextNode('\u2060'))
    const info = document.createElement('div')
    info.className = 'cm-ySelectionInfo'
    info.appendChild(document.createTextNode(this.name))
    elt.appendChild(info)

    elt.appendChild(document.createTextNode('\u2060'))

    this.adjust(elt)
    return elt
  }

  /**
   * @param {HTMLElement} elt
   * @param {SelectionCaretRectangleMarker} prev
   */
  update (elt, prev) {
    if (prev.className !== this.className || !object.equalFlat(prev.style, this.style)) return false
    this.adjust(elt)
    return true
  }

  /**
   * @param {HTMLElement} elt
   */
  adjust (elt) {
    elt.style.left = this.left + 'px'
    elt.style.top = this.top + 'px'
    if (this.width != null) elt.style.width = this.width + 'px'
    elt.style.height = this.height + 'px'
  }

  /**
   * @param {SelectionCaretRectangleMarker} p
   */
  eq (p) {
    return (
      this.left === p.left &&
      this.top === p.top &&
      this.width === p.width &&
      this.height === p.height &&
      this.className === p.className &&
      object.equalFlat(this.style, p.style) &&
      this.name === p.name
    )
  }

  /**
   * @param {cmView.EditorView} view
   * @param {string} className
   * @param {string} color
   * @param {string} name
   * @param {number} head
   * @returns {SelectionCaretRectangleMarker}
   */
  static forRemoteCursor (view, className, color, name, head) {
    const pos = view.coordsAtPos(head, 1)
    if (!pos) return null
    const base = getBase(view)
    return new SelectionCaretRectangleMarker(
      className,
      {
        backgroundColor: color,
        borderColor: color
      },
      name,
      pos.left - base.left,
      pos.top - base.top,
      null,
      pos.bottom - pos.top
    )
  }
}

/**
 * @param {cmView.EditorView} view
 */
const getRemoteSelections = (view) => {
  const conf = view.state.facet(ySyncFacet)
  if (!conf?.awareness) {
    return
  }
  const awareness = conf.awareness

  const ytext = conf.ytext
  const ydoc = /** @type {Y.Doc} */ (ytext.doc)

  const ranges = []

  awareness.getStates().forEach((state, clientid) => {
    if (clientid === awareness.doc.clientID) {
      return
    }
    const cursor = state.cursor
    if (cursor == null || cursor.anchor == null || cursor.head == null) {
      return
    }
    const anchor = Y.createAbsolutePositionFromRelativePosition(
      cursor.anchor,
      ydoc
    )
    const head = Y.createAbsolutePositionFromRelativePosition(
      cursor.head,
      ydoc
    )
    if (
      anchor == null ||
      head == null ||
      anchor.type !== ytext ||
      head.type !== ytext
    ) {
      return
    }
    const { color = '#30bced', name = 'Anonymous' } = state.user || {}
    const colorLight = (state.user && state.user.colorLight) || color
    const range = cmState.EditorSelection.range(anchor.index, head.index)
    ranges.push({ range, color, colorLight, name })
  })

  return ranges
}

export const yRemoteSelectionsLayer = cmView.layer({
  above: false, // render below text
  markers (view) {
    return getRemoteSelections(view).map((r) => {
      if (!r.range.empty) {
        return StyledRectangleMarker.forRangeWithStyle(
          view,
          'cm-ySelection',
          {
            backgroundColor: r.colorLight
          },
          r.range
        )
      }
      return []
    }).reduce((a, b) => a.concat(b), [])
  },
  update (view) {
    if (view.transactions.length > 0) {
      if (view.transactions[0].annotation(yRemoteSelectionsAnnotation)) {
        return true
      }
    }
    return false
  },
  class: 'cm-yRemoteSelectionsLayer'
})

export const yRemoteCursorsLayer = cmView.layer({
  above: true, // render above text to allow hovering
  markers (view) {
    return getRemoteSelections(view).map((r) => {
      const marker = SelectionCaretRectangleMarker.forRemoteCursor(
        view,
        'cm-ySelectionCaret',
        r.color,
        r.name,
        r.range.head
      )
      if (marker) {
        return [marker]
      }
      return []
    }).reduce((a, b) => a.concat(b), [])
  },
  update (view) {
    if (view.transactions.length > 0) {
      if (view.transactions[0].annotation(yRemoteSelectionsAnnotation)) {
        return true
      }
    }
    return false
  },
  class: 'cm-yRemoteCursorsLayer'
})
