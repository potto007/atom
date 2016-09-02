'use babel'

import {CompositeDisposable} from 'event-kit'
import Path from 'path'

export default class PaneItemMruSwitcher {
  constructor (pane) {
    this.disposable = new CompositeDisposable()
    this.pane = pane
    this.ol = this._makeElement('ol', {
      class: 'pane-item-mru-switcher-list',
      tabindex: '-1'
    })
    vert = this._makeElement('div', {class: 'vertical-axis'}, [this.ol])

    // mouseMove = (event) =>
    //   # Event may trigger without a real mouse move if the list scrolls.
    //   return if not @mouseMoved(event)
    //   if (li = event.target.closest('li'))
    //     id = parseInt(li.getAttribute('data-id'))
    //     tabSwitcher.setCurrentId(id)
    //
    // @disposable.add @ol.addEventListener 'mouseenter', (event) =>
    //   @ol.addEventListener 'mousemove', mouseMove
    //
    // @disposable.add @ol.addEventListener 'mouseleave', (event) =>
    //   @lastMouseCoords = null
    //   @ol.removeEventListener 'mousemove', mouseMove
    //
    // @disposable.add @ol.addEventListener 'click', (event) =>
    //   if (li = event.target.closest('li'))
    //     id = parseInt(li.getAttribute('data-id'))
    //     tabSwitcher.select(id)
  }

  show () {
    if (!this.modalPanel) {
      this.modalPanel = atom.workspace.addModalPanel({
        'item': vert,
        'visible': true,
        'className': 'pane-item-mru-switcher'
      })
      this.panel = vert.parentNode
      this._buildList()
    }

    atom.views.getView(this.modalPanel).closest('atom-panel-container').classList.add('pane-item-mru-switcher')
    panel = this.ol.closest('atom-panel')
    this.modalPanel.show()
    // @scrollToCurrentTab()
    this.ol.focus()
    this.panel.classList.add('is-visible')

    // setTimeout => this.panel.classList.add('is-visible')
    //
    // invokeSelect = (event) =>
    //   if not (event.ctrlKey or event.altKey or event.shiftKey or event.metaKey)
    //     @tabSwitcher.select()
    //     unbind()
    //
    // invokeCancel = (event) =>
    //   @tabSwitcher.cancel()
    //   unbind()
    //
    // document.addEventListener 'mouseup', invokeSelect
    // @ol.addEventListener 'blur', invokeCancel
    //
    // unbind = =>
    //   document.removeEventListener 'mouseup', invokeSelect
    //   @ol.removeEventListener 'blur', invokeCancel
  }

  _makeElement (name, attributes, children) {
    let element = document.createElement(name)
    for (const name in attributes)
      element.setAttribute(name, attributes[name])
    if (children)
      for (const child of children)
        element.appendChild(child)
    return element
  }

  _makeItem (paneItem) {
    isEditor = paneItem.constructor.name == 'TextEditor'
    modifiedIcon = this._makeElement('span', {class: 'modified-icon'})
    label = this._makeElement('span', {class: 'tab-label'}, [document.createTextNode(paneItem.getTitle())])

    if (isEditor) {
      function toggleModified () {
        const action = paneItem.isModified() ? 'add' : 'remove'
        label.classList[action]('modified')
      }
      this.disposable.add(paneItem.onDidChangeModified(toggleModified))
      toggleModified()
      path = paneItem.getPath()
      icon = this._makeElement('span', {
        class: 'icon icon-file-text',
        'data-name': Path.extname(path)
      })
      dir = path ? this._projectRelativePath(path) : ''
      sublabelText = document.createTextNode(dir)
      sublabel = this._makeElement('span', {class: 'tab-sublabel'}, [sublabelText])
      labels = this._makeElement('span', {class: 'tab-labels'}, [modifiedIcon, label, sublabel])
    }
    else {
      icon = this._makeElement('span', {class: 'icon icon-tools'})
      labels = label
    }

    return this._makeElement('li', {'data-id': paneItem.id}, [icon, labels]) // Ian TODO unique ID?
  }

  _buildList () {
    while (this.ol.children.length > 0)
      this.ol.removeChild(this.ol.children[0])
    for (const paneItem of this.pane.itemStack) // Ian TODO: order deterministic?
      this.ol.appendChild(this._makeItem(paneItem))
  }

  _isUnder (dir, path) {
    return Path.relative(path, dir).startsWith('..')
  }

  _projectRelativePath (path) {
    path = Path.dirname(path) // Ian TODO same name as arg?
    let root, relativePath
    [root, relativePath] = atom.project.relativizePath(path)
    if (root) {
      if (atom.project.getPaths().length > 1)
        relativePath = Path.basename(root) + Path.sep + relativePath
      return relativePath
    }
    else if (home && this._isUnder(home, path))
      return '~' + Path.sep + Path.relative(home, path)
    else
      return path
  }

}
