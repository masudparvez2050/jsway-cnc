if (typeof Script === 'undefined') {
  window.Script = class Script {
    constructor({attrId, name}) {
      this.attrId = attrId;
      this.name = name;
      this.utilts = (typeof Utilts !== 'undefined' && Utilts.ins) ? Utilts.ins() : { htmlDecode: function(s) { return s; }, getOffset: function() { return { left: 0, top: 0 }; } };
    }
  };
}
class ScriptHeaderNav extends Script {
  constructor(params) {
    super(params)
    this.$dom = document.querySelector(`#${this.attrId}`)
    if (!this.$dom) return
    this.headerConfig = JSON.parse(this.utilts.htmlDecode(params.config))
    this.$firstNav = this.$dom.querySelectorAll('.unit-header-nav__item')
    this.$subNavBox = this.$dom.querySelector('.unit-header-nav__subNav')
    this.$navBox = this.$dom.querySelector('.unit-header-nav')
    this.$mobOverlay = null
    this.header_type = JSON.parse(params.config).header_type
  }
  init() {
    if (!this.$dom) return
    if (!window.app.info.utilts.checkDesign()) {
      this.$mobOverlay = document.querySelector('.mobile_menu_overlay')
      if (!this.$mobOverlay) {
        const $overlay = document.createElement('div')
        $overlay.classList.add('mobile_menu_overlay')
        $overlay.style.height = document.body.offsetHeight - document.querySelector('[package-type="header"]').offsetHeight + 'px'
        $overlay.style.top = document.querySelector('[package-type="header"]').offsetHeight + 'px'
        document.body.append($overlay)
        this.$mobOverlay = document.querySelector('.mobile_menu_overlay')
      }

      // 导航出现二级栏目时候 显示隐藏遮罩层的判断
      if (this.$subNavBox && parseInt(this.$subNavBox.getAttribute('header-type'))) {
        if (blockHeader.classList.contains('header-hide')) {
          this.$mobOverlay.style.display = 'none'
        } else {
          if (this.$subNavBox && this.$subNavBox.classList.contains('show')) {
            this.$mobOverlay.style.display = 'block'
            this.$mobOverlay.style.height = (document.body.offsetHeight - document.querySelector('[package-type="header"]').offsetHeight - window.pageYOffset) + 'px'
            this.$mobOverlay.style.top = (document.querySelector('[package-type="header"]').offsetHeight + window.pageYOffset) + 'px'
          }
        }
      }
    }
    this.initFirstNavEvent()
  }

  showUniversalFn($el) {
    if ($el.getAttribute('header-type') == 2) {
      for (let key of this.$firstNav) {
        key.classList.remove('is-active')
      }
      $el.classList.add('is-active')
    }
    this.$subNavBox.classList.remove('show')
    if (this.$mobOverlay) this.$mobOverlay.style.display = 'none'
    const $content = $el.querySelector('.unit-header-nav__item-content')
    if ($content) {
      const headerType = parseInt($content.getAttribute('header-type'))
      if (headerType === 2) {
        this.setFlatTwoFun($content, headerType)
      } else {
        this.$subNavBox.innerHTML = $content.innerHTML
        this.$subNavBox.classList.add('show')
        this.$subNavBox.setAttribute('sub-menu-type', headerType)
        this.setSecondPosition(this.$subNavBox, $el, headerType)
        let $subNav = null
        if (headerType === 1) {
          this.$subNavBox.innerHTML += '<div id="unit-header-nav-flat-dropdown"></div>'
          $subNav = this.$subNavBox.querySelectorAll('.unit-header-nav-flat__item-son')
        } else {
          $subNav = this.$subNavBox.querySelectorAll('.unit-header-nav__item-son')
        }
        if ($subNav) this.initSubNavEvent($subNav, headerType, 1)

        // 显示遮罩层
        if (headerType == 1 && this.$mobOverlay) {
          this.$mobOverlay.style.display = 'block'
          this.$mobOverlay.style.height = (document.body.offsetHeight - document.querySelector('[package-type="header"]').offsetHeight - window.pageYOffset) + 'px'
          this.$mobOverlay.style.top = (document.querySelector('[package-type="header"]').offsetHeight + window.pageYOffset) + 'px'
        }
      }
    } else {
      let flatTwoNav = document.querySelector('.unit-header-nav__subNav-flattwo')
      if (flatTwoNav) flatTwoNav.classList.remove('show')
    }
  }

  setFlatTwoFun(contentEle, headerType, initname) {
    let flatTwoNav = document.querySelector('.unit-header-nav__subNav-flattwo')
    if (!flatTwoNav) {
      flatTwoNav = document.createElement('div')
      flatTwoNav.classList.add('unit-header-nav__subNav-flattwo')
    }
    if (contentEle) flatTwoNav.innerHTML = contentEle.innerHTML
    setTimeout(() => {
      if (!initname) flatTwoNav.classList.add('show')
      flatTwoNav.setAttribute('sub-menu-type', headerType)
      flatTwoNav.setAttribute('subMenu', true)
      if (contentEle) flatTwoNav.setAttribute('style', contentEle.getAttribute('style'))
    }, 100);
    const parentsEle = this.utilts.getParentsByAttr(this.$dom, 'package-item', 'module')
    let containerWidth = 0
    if (parentsEle && parentsEle.length) {
      containerWidth = window.getComputedStyle(parentsEle[0].querySelector('.container'), null).maxWidth.slice(0, -2) * 1
      parentsEle[0].appendChild(flatTwoNav)
    }
    let flattwoSonContent = parentsEle[0].querySelectorAll('.unit-header-nav-flattwo_item-son-content')
    const setFlattwoSonContentPadding = () => {
      Array.from(flattwoSonContent).forEach(item => {
        item.style.paddingLeft = window.innerWidth < containerWidth ? '0px' : '5px'
      })
    }
    setFlattwoSonContentPadding()
    window.addEventListener('resize', setFlattwoSonContentPadding)
  }

  initFirstNavEvent() {
    let logoHeight = 0
    document.querySelectorAll('[package-type="header"] .unit-logo').forEach(_val => {
      if (_val.offsetHeight) logoHeight = _val.offsetHeight
    })
    this.setFlatTwoFun('', 2, 'init')
    for (let $el of this.$firstNav) {
      if ($el.querySelector('.unit-header-nav__item-content') && $el.querySelector('.unit-header-nav__item-content').getAttribute('header-type') == 2 && $el.querySelector('.unit-header-nav__item-link.active')) this.showUniversalFn($el)
      if (logoHeight) $el.style.height = logoHeight + 20 + 'px'
      $el.addEventListener('mouseenter', () => {
        this.showUniversalFn($el)
      })
      this.$navBox.addEventListener('mouseleave', () => {
        this.$subNavBox.classList.remove('show')
        if (this.$mobOverlay) this.$mobOverlay.style.display = 'none'
      })
    }
    // 移出header，收起整个下拉菜单
    if (this.header_type === 2) {
      document.querySelector('[package-type="header"]').addEventListener('mouseleave', function (e) {
        document.querySelector('.unit-header-nav__subNav-flattwo').classList.remove('show')
        document.querySelectorAll('.unit-header-nav__item').forEach(item => item.classList.remove('is-active'))
      })
    }
  }

  // 导航的二级事件
  initSubNavEvent($subNav, headerType = 0, level) {
    level++
    if (headerType === 1) {
      // 添加更多箭头
      for (let $el of $subNav) {
        if (($el.querySelector('.item-list-container > a')?.offsetHeight || 0) + ($el.querySelector('.item-list-container > div')?.offsetHeight || 0) > 310) {
          let $itemContainer = $el.querySelector('.item-list-container')
          let $more = $el.querySelector('.unit-nav-flat_more')
          $more.style.visibility = 'visible'
          $more.addEventListener('click', () => {
            $itemContainer.style.maxHeight = 'inherit'
            if ($el.querySelector('.show')) {
              $more.classList.remove('show')
              $itemContainer.style.maxHeight = ''
            } else {
              $more.classList.add('show')
            }
          })
        }

        if (level === 2) {
          const $sonNav = $el.querySelectorAll('.unit-header-nav__item-grandson-tile')
          $sonNav.forEach(item => {
            item.addEventListener('mouseenter', () => {
              this.$subNavBox.querySelector('#unit-header-nav-flat-dropdown').innerHTML = ''
              const $content = item.querySelector('.unit-header-nav__item-sub-content')
              if ($content) {
                const pLeft = this.utilts.getOffset(item).left + item.querySelector('.unit-nav-flat_son_name').offsetWidth + 27
                const pTop = this.utilts.getOffset(item).top - this.utilts.getOffset(this.$subNavBox).top + this.$subNavBox.scrollTop - 5
                this.$subNavBox.querySelector('#unit-header-nav-flat-dropdown').innerHTML = '<div parent-id="' + item.dataset.id + '" class="unit-nav-flat_dropdown" style="left: ' + pLeft + 'px; top: ' + pTop + 'px">' + $content.innerHTML + '</div>'

                const $dropdown = this.$subNavBox.querySelector('.unit-nav-flat_dropdown')
                $dropdown.classList.add('show')
                $dropdown.addEventListener('mouseleave', () => {
                  $dropdown.classList.remove('show')
                  $el.querySelector('[data-id="' + item.dataset.id + '"]').classList.remove('active')
                })
                $dropdown.addEventListener('mouseenter', () => {
                  $dropdown.classList.add('show')
                  $el.querySelector('[data-id="' + item.dataset.id + '"]').classList.add('active')
                })
              }
            })
            item.addEventListener('mouseleave', () => {
              const $dropdown = this.$subNavBox.querySelector('.unit-nav-flat_dropdown')
              if ($dropdown) {
                $dropdown.classList.remove('show')
              }
            })
          })
        }
      }
    } else {
      for (let $el of $subNav) {
        const $content = $el.querySelector('.unit-header-nav__item-sub-content')
        $el.addEventListener('mouseenter', () => {
          this.$subNavBox.classList.add('show')
          if ($content) {
            const pLeft = this.utilts.getOffset($el).left
            if (pLeft + 250 > window.innerWidth) {
              $content.style.left = 'auto'
              $content.style.right = '100%'
            } else {
              $content.style.left = '100%'
              $content.style.right = 'auto'
            }
            $content.classList.add('show')

            if (level === 2) {
              const $sonNav = $content.querySelectorAll('.unit-header-nav__item-grandson')
              if ($sonNav) this.initSubNavEvent($sonNav, headerType, level)
            }
          }
        })
        $el.addEventListener('mouseleave', () => {
          if ($content) $content.classList.remove('show')
          this.$subNavBox.classList.remove('show')
        })
      }
    }
  }
  /** 二级菜单定位 */
  setSecondPosition($target, $parent, headerType = 0) {
    const pLeft = this.utilts.getOffset($parent).left
    const boxLeft = this.utilts.getOffset(this.$navBox).left
    if (+headerType === 1 || +headerType === 2) {
      $target.style.left = -1 * boxLeft + 'px'
      $target.style.width = window.innerWidth + 'px'
      if (+headerType === 2) $target.style.width = document.querySelector('[package-type="header"]').offsetWidth + 'px'
      $target.style.removeProperty('top')
    } else {
      if (pLeft + 250 > window.innerWidth) {
        $target.style.left = (pLeft + $parent.offsetWidth - boxLeft - $target.offsetWidth) + 'px'
        $target.classList.add('show_right')
      } else {
        $target.style.left = (pLeft - boxLeft) + 'px'
        $target.classList.remove('show_right')
      }
      $target.style.width = 'auto'
      const linkDom = $parent.querySelector('.unit-header-nav__item-link ')
      console.log('/*--', linkDom.getAttribute('show-line-height'))
      if (linkDom.getAttribute('show-line-height')) {
        const parentHeight = $parent.offsetHeight
        const navlinkHeight = linkDom.offsetHeight
        $target.style.top = `calc(100% - ${(parentHeight - navlinkHeight) / 2}px)`
      }
    }
  }
}