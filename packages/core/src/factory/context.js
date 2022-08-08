import unique from "@form-create/utils/lib/unique"
import toCase from "@form-create/utils/lib/tocase"
import extend from "@form-create/utils/lib/extend"
import mergeProps from "@form-create/utils/lib/mergeprops"
import { enumerable, invoke } from "../frame/util"
import { deepCopy } from "@form-create/utils/lib/deepextend"
import { markRaw, reactive } from "vue"
import is from "@form-create/utils/lib/type"

function isNone(ctx) {
  const none = !(is.Undef(ctx.prop.display) || !!ctx.prop.display)
  if (ctx.parent) {
    return ctx.parent.none || none
  } else {
    return none
  }
}

function bind(ctx) {
  Object.defineProperties(ctx.origin, {
    __fc__: enumerable(markRaw(ctx), true)
  })
}

export default function RuleContext(handle, rule) {
  const id = unique()
  const isInput = !!rule.field
  extend(this, {
    id,
    ref: id,
    wrapRef: id + "fi",
    rule,
    origin: rule.__origin__ || rule,
    name: rule.name,
    pending: {},
    none: false,
    watch: [],
    linkOn: [],
    root: [],
    ctrlRule: [],
    parent: null,
    cacheConfig: null,
    prop: { ...rule },
    computed: {},
    payload: {},
    refRule: {},
    input: isInput,
    el: undefined,
    defaultValue: isInput ? deepCopy(rule.value) : undefined,
    field: rule.field || undefined
  })

  this.updateType()
  this.updateKey()
  bind(this)
  this.update(handle, true)
}

extend(RuleContext.prototype, {
  loadChildrenPending() {
    const children = this.rule.children || []
    if (Array.isArray(children)) return children
    return this.loadPending({
      key: "children",
      origin: children,
      def: [],
      onLoad: data => {
        this.$handle && this.$handle.loadChildren(data, this)
      },
      onUpdate: (value, oldValue) => {
        if (this.$handle) {
          value === oldValue
            ? this.$handle.loadChildren(value, this)
            : this.$handle.updateChildren(this, value, oldValue)
        }
      },
      onReload: value => {
        if (this.$handle) {
          this.$handle.updateChildren(this, [], value)
        } else {
          delete this.pending.children
        }
      }
    })
  },
  loadPending(config) {
    const { key, origin, def, onLoad, onReload, onUpdate } = config

    if (this.pending[key] && this.pending[key].origin === origin) {
      return this.getPending(key, def)
    }

    delete this.pending[key]

    let value = origin
    if (is.Function(origin)) {
      const source = invoke(() =>
        origin({
          rule: this.rule,
          api: this.$api,
          update: data => {
            const value = data || def
            const oldValue = this.getPending(key, def)
            this.setPending(key, origin, value)
            onUpdate && onUpdate(value, oldValue)
          },
          reload: () => {
            const oldValue = this.getPending(key, def)
            delete this.pending[key]
            onReload && onReload(oldValue)
            this.$api && this.$api.sync(this.rule)
          }
        })
      )
      if (source && is.Function(source.then)) {
        source.then(data => {
          const value = data || def
          this.setPending(key, origin, value)
          onLoad && onLoad(value)
          this.$api && this.$api.sync(this.rule)
        })
        value = def
        this.setPending(key, origin, value)
      } else {
        value = source || def
        this.setPending(key, origin, value)
        onLoad && onLoad(value)
      }
    }
    return value
  },
  getPending(key, def) {
    return (this.pending[key] && this.pending[key].value) || def
  },
  setPending(key, origin, value) {
    this.pending[key] = {
      origin,
      value: reactive(value)
    }
  },
  effectData(name) {
    if (!this.payload[name]) {
      this.payload[name] = {}
    }
    return this.payload[name]
  },
  clearEffectData(name) {
    delete this.payload[name]
  },
  updateKey(flag) {
    this.key = unique()
    flag && this.parent && this.parent.updateKey(flag)
  },
  updateType() {
    this.originType = this.rule.type
    this.type = toCase(this.rule.type)
  },
  setParser(parser) {
    this.parser = parser
    parser.init(this)
  },
  initProp() {
    const rule = { ...this.rule }
    delete rule.children
    this.prop = mergeProps([
      rule,
      ...Object.keys(this.payload).map(k => this.payload[k]),
      this.computed
    ])
  },
  initNone() {
    this.none = isNone(this)
  },
  check(handle) {
    return this.vm === handle.vm
  },
  unwatch() {
    this.watch.forEach(un => un())
    this.watch = []
    this.refRule = {}
  },
  unlink() {
    this.linkOn.forEach(un => un())
    this.linkOn = []
  },
  link() {
    this.unlink()
    this.$handle.appendLink(this)
  },
  watchTo() {
    this.$handle.watchCtx(this)
  },
  delete() {
    const undef = void 0
    this.unwatch()
    this.unlink()
    this.rmCtrl()
    extend(this, {
      deleted: true,
      prop: { ...this.rule },
      computed: {},
      el: undef,
      $handle: undef,
      $render: undef,
      $api: undef,
      vm: undef,
      vNode: undef,
      parent: null,
      cacheConfig: null,
      none: false
    })
  },
  rmCtrl() {
    this.ctrlRule.forEach(ctrl => ctrl.__fc__ && ctrl.__fc__.rm())
    this.ctrlRule = []
  },
  rm() {
    const _rm = () => {
      const index = this.root.indexOf(this.origin)
      if (index > -1) {
        this.root.splice(index, 1)
        this.$handle && this.$handle.refresh()
      }
    }
    if (this.deleted) {
      _rm()
      return
    }
    this.$handle.noWatch(() => {
      this.$handle.deferSyncValue(() => {
        this.rmCtrl()
        _rm()
        this.$handle.rmCtx(this)
        extend(this, {
          root: []
        })
      }, this.input)
    })
  },
  update(handle, init) {
    extend(this, {
      deleted: false,
      $handle: handle,
      $render: handle.$render,
      $api: handle.api,
      vm: handle.vm,
      trueType: handle.getType(this.originType),
      vNode: handle.$render.vNode,
      updated: false
    })
    !init && this.unwatch()
    this.watchTo()
    this.link()
  }
})
