class ScriptLifisherCopyright extends Script {
    constructor(params) {
        super(params)
        this.$dom = document.querySelector(`#${this.attrId}`)
        this.$template = document.querySelector(`#${this.attrId} template`)
        this.expandContent = JSON.parse(this.utilts.htmlDecode(params.expandContent || '[]'))
        this.utils = Utilts.ins()
    }

    /** 初始化，支持异步 */
    init() {
        const unit = this.$dom
        const utils = this.utils
        const that = this
        unit.setAttribute('data-lifisher-copyright', 'true')
        if (utils.checkDesign()) {
            const designInitCopyRight = function () {
                setTimeout(function () {
                    const mceContainer = that.$dom.querySelector('[tinymce]')
                    const mceId = mceContainer ? mceContainer.getAttribute('id') : ''
                    if (mceId) {
                        const editor = tinymce.get(mceId)
                        editor.on('SetContent', function () {
                            that.render()
                        })
                        that.render()
                    }
                }, 500)
            }
            window.addEventListener('designAfterInitTinyMce', function () {
                designInitCopyRight()
            }, {once: true})
            window.addEventListener('appInitEnd', function () {
                designInitCopyRight()
            })
        } else {
            that.render()
        }
    }

    render() {
        this.renderLifisherCopyright()
    }

    renderIconColor() {
        const unit = this.$dom
        const unitStyle = getComputedStyle(unit)
        const unitItemStyle = getComputedStyle(unit.querySelector('.unit-text__item'))
        const configColor = unitStyle.getPropertyValue('--lifisher-copyright-color').toLowerCase()
        const defaultCopyrightColor = unitItemStyle.getPropertyValue('color')
        const DEFAULT_OPACITY = '.6';
        const fetchRgbColor = function () {
            let rgb = ''
            if (/rgba?[(](.*)[)]$/.test(defaultCopyrightColor)) {
                const matches = /rgba?[(](.*)[)]$/.exec(defaultCopyrightColor)
                const rgba = matches && matches[1]
                const arr = rgba.split(',')
                if (arr.length === 4) {
                    arr[3] = DEFAULT_OPACITY
                } else if (arr.length === 3) {
                    arr.push(DEFAULT_OPACITY)
                }
                rgb = arr.join(',')
            } else if (/^#/.test(defaultCopyrightColor)) {
                const hex = defaultCopyrightColor.replace('#', '')
                if (hex.length === 6) {
                    rgb = parseInt('0x' + hex.slice(0, 2)).toString() + ','
                        + parseInt('0x' + hex.slice(2, 4)).toString() + ','
                        + parseInt('0x' + hex.slice(4, 5)).toString()
                } else if (hex.length === 3) {
                    rgb = parseInt('0x' + hex[0] + hex[0]).toString() + ','
                        + parseInt('0x' + hex[1] + hex[1]).toString() + ','
                        + parseInt('0x' + hex[2] + hex[2]).toString()
                }
                rgb += ',' + DEFAULT_OPACITY
            }
            if (rgb) {
                const color = 'rgba(' + rgb + ')'
                unit.style.setProperty('--lifisher-copyright-color', color)
                return 'rgba(' + rgb + ')'
            }
            return ''
        }
        return /^(rgb|#)/i.test(configColor) ? configColor : fetchRgbColor() || defaultCopyrightColor
    }

    renderShawRoot(){
        const SHADOW_CLASSNAME = 'lifisher-copyright-shadow'
        const SHADOW_SELECTOR = '.' + SHADOW_CLASSNAME
        const unit = this.$dom
        const unitStyle = getComputedStyle(unit)
        const configFontSize = unitStyle.getPropertyValue('--lifisher-copyright-font-size').toLowerCase()
        const shadowElem = unit.querySelector(SHADOW_SELECTOR)
        if (!shadowElem) {
            const shadow = document.createElement('span')
            shadow.classList.add(SHADOW_CLASSNAME)
            shadow.style.display = 'inline-flex'
            shadow.style.setProperty('min-height', '1.5em')
            shadow.style.setProperty('text-transform', 'capitalize')
            if (!configFontSize) shadow.style.setProperty('--lifisher-copyright-font-size', '1em')
            const links = unit.querySelectorAll('.unit-text a')
            const sitemap = Array.from(links).find(function (link) {
                return /sitemap/i.test(link.getAttribute('href'))
            })
            // 按顺序检查放置位置 sitemap, .unit-text__item > [tinymce] > div, .unit-text__item > [tinymce]
            if (sitemap) {
                sitemap.insertAdjacentElement('beforebegin', shadow)
            } else {
                let wrap = unit.querySelector('.unit-text__item [tinymce]') || unit.querySelector('.unit-text__item')
                if (!wrap) {
                    wrap = unit
                } else if (wrap.firstElementChild) {
                    wrap = wrap.firstElementChild
                }
                wrap.insertAdjacentElement('beforeend', shadow)
            }
        }
    }

    renderLifisherCopyright() {
        const SHADOW_CLASSNAME = 'lifisher-copyright-shadow'
        const SHADOW_SELECTOR = '.' + SHADOW_CLASSNAME
        const elem = this.$dom.querySelector(SHADOW_SELECTOR)
        if (elem && elem.shadowRoot) {
            return
        } else if (elem) {
            this.$dom.querySelectorAll(SHADOW_SELECTOR).forEach(function (node, i) {
                node.remove()
            })
        }
        this.renderShawRoot()
        const shadowElem = this.$dom.querySelector(SHADOW_SELECTOR)
        if (shadowElem) {
            const shadowRoot = shadowElem.shadowRoot ? shadowElem.shadowRoot : shadowElem.attachShadow({mode: 'open'})
            const div = document.createElement('div')
            div.innerHTML = this.$template.innerHTML
            const contentList = this.expandContent
            if (div.querySelector('.lifisher-copyright')) {
              contentList.push({
                class: 'lifisher-copyright',
                icon: '1',
                order: '1'
              })
            }
            contentList.forEach(item => {
              const atag = div.querySelector(`.${item.class}__link`)
              
              const href = atag?.getAttribute('href') ? atag.getAttribute('href').trim() : ''
              if (atag && !href) {
                  // remove <a>
                  div.querySelector(`.${item.class}`).innerHTML = atag.innerHTML
              }
              const style = div.querySelector(`.${item.class}`).style
              if (item.icon) {
                const color = this.renderIconColor()
                style.setProperty('color', color)
                style.setProperty(`--${item.class}-color`, color)
              }
              style.setProperty('display', 'inline-flex')
              style.setProperty('align-items', 'center')
              style.setProperty('order', item.order)
              style.setProperty('margin-left', '0.6ch')
            })
            shadowRoot.append.apply(shadowRoot, div.children)
        }
    }
}
