class ScriptProductDetail extends Script {
  constructor(params) {
    super(params)
    this._attrs = {
      lastWindowWidth: window.innerWidth
    }
    this._original = {}
    this.params = params
    this.hasBuyOn = params.hasBuyOn
    this.showContent = JSON.parse(this.utilts.htmlDecode(params.showContent))
    this.show_quote_list = params.show_quote_list
    this.isM = window.innerWidth < 768
    this.$dom = document.querySelector(`#${this.attrId}`)
    this.$iconGroup = null
    this.$btnGroup = null
    this.patternModal = null
    this.isShop = window.app.info.site.is_shop
    this.loadingTarget = 96
    this.loadingTimeout = null
  }
  async init() {
    this.beforeInit()
    this.checkStatus()
    await this.initScript()
    this.afterInit()
  }

  beforeInit() {
    const params = this.params
    this._original.direction = this.params._direction || this.params.direction; // 保存初始的方向
    const isMobi = window.innerWidth < 1200
    if (isMobi) {
      params.direction = 'bottom'
    }
  }

  afterInit() {
    const unit = document.querySelector(`#${this.attrId} .unit-product-detail`);
    unit && unit.removeAttribute('before-init')
    const params = this.params
    const that = this;
    const allClasses = ['unit-detail-album--x', 'unit-detail-album--y', 'unit-detail-album--top', 'unit-detail-album--bottom', 'unit-detail-album--left', 'unit-detail-album--right']
    const directMap = {
      top: {
        direction: 'horizontal',
        classList: ['unit-detail-album--y', 'unit-detail-album--top']
      },
      bottom: {
        direction: 'horizontal',
        classList: ['unit-detail-album--y', 'unit-detail-album--bottom']
      },
      left: {
        direction: 'vertical',
        classList: ['unit-detail-album--x', 'unit-detail-album--left']
      },
      right: {
        direction: 'vertical',
        classList: ['unit-detail-album--x', 'unit-detail-album--right']
      }
    };
    const thumb = that.$dom.querySelector('.unit-detail-album__thumb')
    window.addEventListener('resize', function () {
      if (Math.abs(that._attrs.lastWindowWidth - window.innerWidth) <= 20) {
        // 非宽度变化不处理
        return;
      }
      if (!window.hasOwnProperty('_lf_timers_')) {
        window._lf_timers_ = {}
      }
      that._attrs.lastWindowWidth = window.innerWidth
      const timer = params.attrId + '@resize';
      if (window._lf_timers_[timer]) {
        clearTimeout(window._lf_timers_[timer])
        delete window._lf_timers_[timer]
      } else {
        thumb.setAttribute('hidden', 'true')
      }
      window._lf_timers_[timer] = setTimeout(function () {
        delete window._lf_timers_[timer];
        const isMobi = window.innerWidth < 1200
        const direct = that._original.direction
        let direction = !isMobi && direct && directMap.hasOwnProperty(direct) ? direct : 'bottom'
        const targetClassList = directMap[direction].classList
        if (isMobi) {
          unit.classList.add('unit-product-detail-mobi')
        } else {
          unit.classList.remove('unit-product-detail-mobi')
        }
        that.$dom.classList.remove.apply(that.$dom.classList, allClasses);
        that.$dom.classList.add.apply(that.$dom.classList, targetClassList);
        thumb.removeAttribute('hidden')
        that.unitAlbum.swiperThumb.changeDirection(directMap[direction].direction).update()
        that.unitAlbum.swiperPicture.update()
      }, 500)
    })

    window.addEventListener('evt_open_product_inquiry', function () {
      document.querySelector('.unit-detail-button-inquiry').click()
    })

    const promptLogin = this.utilts.throttle(function () {
      const message = Utilts.ins().$t('Please login in first')
      if (confirm(message)) window.location.href = globalThis.Server.getRinseHref('/login.html', window.app.info.site)
    }, 200)

    window.addEventListener('evt_required_login', function () {
      promptLogin();
    })
    setTimeout(() => {
      if (!this.showContent.includes('btn') || !window.app.info.productDetail.config.button_authority.includes('inquiry')){
        const allProductInquiryBtns = document.querySelectorAll('.unit-detail-html-tabs__content-html [cloud-editor="unit"][type="cebutton"] [ce-data-type="link"][target="product_inquiry"]')
        allProductInquiryBtns.forEach(val => {
          val.classList.add('d-none')
        })
      }
    }, 100)
  }

  // 移动端执行
  initMobile() {
    if (document.querySelector('.unit-detail-footer') || window.app.utilts.checkDesign()) return
    this.initFooter()
    this.initBtn()
    this.initPatternModal()
  }
  // 初始化底部
  initFooter() {
    const $app = document.getElementById('app')
    const $div = document.createElement('div')
    const $div1 = document.createElement('div')
    const $div2 = document.createElement('div')
    $app.classList.add('with-footer')
    $div.classList.add('unit-detail-footer')
    $div1.classList.add('unit-detail-footer_icon-group')
    $div2.classList.add('unit-detail-footer_btn-group')
    $div.appendChild($div1)
    $div.appendChild($div2)
    $app.appendChild($div)
    this.$iconGroup = $div1
    this.$btnGroup = $div2
    document.querySelector('.widget-toTop-wrap').style.bottom = 'calc(80px + var(--SAIB))'
  }
  // 初始化按钮组
  initBtn() {
    // 客服按钮
    if (document.getElementById('widgetSocialMediaChat')) {
      const $service = document.createElement('div')
      $service.classList.add('unit-detail-button-service')
      $service.innerHTML = `<span class="iconfont icon-kefu-line"></span>`
      this.$iconGroup.append($service)
      $service.addEventListener('click', () => {
        document.getElementById('widgetSocialMediaChat').querySelector('.widget-social-media-chat__server').click()
      })
    }

    // 2b是没有购买按钮的
    if (this.isShop && window.app.info.productDetail.status) {
      const $buy = this.$dom.querySelector('.unit-detail-button-buy')
      const $cart = this.$dom.querySelector('.unit-detail-button-cart')
      this.$btnGroup.append($cart)
      this.$btnGroup.append($buy)
    }
    const $comment = this.$dom.querySelector('.unit-detail-button-comment')
    const $inquiry = this.$dom.querySelector('.unit-detail-button-inquiry')
    this.calcInquiryBtn($inquiry)
    if ($comment) this.$iconGroup.append($comment)
    if ($inquiry) this.$iconGroup.append($inquiry)
    this.calcQuoteBtn()
  }
  // 初始化款式参数弹窗
  initPatternModal() {
    if (!this.patternModal) {
      this.patternModal = new Modal()
      this.patternModal.init({
        title: '',
        body: this.getPatternGroup(),
        size: 'lg',
        className: "pattern-modal",
        submitText: window.app.utilts.$t('Buy Now'),
        cancelText: window.app.utilts.$t('Add To Cart'),
        isCloseNoCancel: true,
        onSubmit: () => {
          this.utilts.setBtnLoadingStatus(this.patternModal.$submit, true)
          this.unitButtonBuy.outerBuy()
          setTimeout(() => {
            this.utilts.setBtnLoadingStatus(this.patternModal.$submit, false)
          }, 1000)
        },
        onCancel: () => {
          this.utilts.setBtnLoadingStatus(this.patternModal.$cancel, true)
          this.unitButtonCart.outerAddCart()
          setTimeout(() => {
            this.utilts.setBtnLoadingStatus(this.patternModal.$cancel, false)
          }, 1000)
        }
      })
    }
  }
  // 引用各组件的js
  async initScript() {
    await Promise.all([
      new Load('/assets/js/unit/detail-album.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-price.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-comment-score.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-like.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-order-quantity.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-pattern.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-quantity.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-logistics.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-customized.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-alert-size-chart.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-button-buy.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-button-cart.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-button-comment.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-button-inquiry.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/matching-product.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-payment.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-wholesale.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-shipment-time.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-button-download.js', 'application/javascript', {version_enabled: true}),
      new Load('/assets/js/unit/detail-button-quote.js', 'application/javascript', {version_enabled: true}),
    ])
    this.unitAlbum = new ScriptDetailAlbum({ ...this.params, name: 'ScriptDetailAlbum' })
    if (this.showContent.includes('score')) this.unitCommentScore = new ScriptDetailCommentScore({...this.params, name: 'ScriptDetailCommentScore'})
    if (this.showContent.includes('like')) this.unitLike = new ScriptDetailLike({...this.params, name: 'ScriptDetailLike'})
    if (this.showContent.includes('pattern')) this.unitPattern = new ScriptDetailPattern({...this.params, name: 'ScriptDetailPattern'})
    if (this.showContent.includes('customized')) this.unitCustomized = new ScriptDetailCustomized({...this.params, name: 'ScriptDetailCustomized'})
    if (this.showContent.includes('size-chart')) this.unitAlertSizeChart = new ScriptDetailAlertSizeChart({...this.params, name: 'ScriptDetailAlertSizeChart'})
    if (this.showContent.includes('btn')) this.unitButtonComment = new ScriptDetailButtonComment({...this.params, name: 'ScriptDetailButtonComment'})
    if (this.showContent.includes('btn')) this.unitButtonInquiry = new ScriptDetailButtonInquiry({...this.params, name: 'ScriptDetailButtonInquiry'})
    if (this.showContent.includes('matching')) this.unitMatch = new ScriptMatchingProduct({...this.params, name: 'ScriptMatchingProduct'})
    if (this.showContent.includes('btn')) this.unitButtonDownload = new ScriptDetailButtonDownload({...this.params, name: 'ScriptDetailButtonDownload'})
    if (this.showContent.includes('btn') && this.show_quote_list == 1) this.unitButtonQuote = new ScriptDetailButtonQuote({...this.params, name: 'ScriptDetailButtonQuote'})
      // 商城
    if (this.isShop) {
      if (this.showContent.includes('price')) this.unitPrice = new ScriptDetailPrice({...this.params, name: 'ScriptDetailPrice'})
      if (this.showContent.includes('order')) this.unitOrderQuantity = new ScriptOrderQuantity({...this.params, name: 'ScriptOrderQuantity'})
      if (this.showContent.includes('logistics')) this.unitLogistics = new ScriptDetailLogistics({...this.params, name: 'ScriptDetailLogistics'})
      if (this.showContent.includes('btn')) this.unitButtonBuy = new ScriptDetailButtonBuy({...this.params, name: 'ScriptDetailButtonBuy'})
      if (this.showContent.includes('btn')) this.unitButtonCart = new ScriptDetailButtonCart({...this.params, name: 'ScriptDetailButtonCart'})
      if (this.showContent.includes('payment')) this.unitPayment = new ScriptDetailPayment({...this.params, name: 'ScriptDetailPayment'})
      if (this.showContent.includes('shippingTime')) this.unitShipmentTime = new ScriptDetailShipmentTime({...this.params, name: 'ScriptDetailShipmentTime'})
      if (this.showContent.includes('number')) this.unitQuantity = new ScriptDetailQuantity({...this.params, name: 'ScriptDetailQuantity'})
      this.unitWholesale = new ScriptDetailWholesale({...this.params, name: 'ScriptDetailWholesale'})
    }
    // 类对象映射
    this.unitScript = {
      ScriptDetailAlbum: this.unitAlbum || null,
      ScriptDetailCommentScore: this.unitCommentScore || null,
      ScriptDetailLike: this.unitLike || null,
      ScriptDetailPattern: this.unitPattern || null,
      ScriptDetailQuantity: this.unitQuantity || null,
      ScriptDetailCustomized: this.unitCustomized || null,
      ScriptDetailAlertSizeChart: this.unitAlertSizeChart || null,
      ScriptDetailButtonComment: this.unitButtonComment || null,
      ScriptDetailButtonInquiry: this.unitButtonInquiry || null,
      ScriptMatchingProduct: this.unitMatch || null,
      ScriptDetailPrice: this.unitPrice || null,
      ScriptOrderQuantity: this.unitOrderQuantity || null,
      ScriptDetailLogistics: this.unitLogistics || null,
      ScriptDetailButtonBuy: this.unitButtonBuy || null,
      ScriptDetailButtonCart: this.unitButtonCart || null,
      ScriptDetailWholesale: this.unitWholesale || null,
      ScriptDetailPayment: this.unitPayment || null,
      ScriptDetailShipmentTime: this.unitShipmentTime || null,
      ScriptDetailButtonDownload: this.unitButtonDownload || null,
      ScriptDetailButtonQuote: this.unitButtonQuote || null,
    }
    // 类初始化
    for (const key in this.unitScript) {
      if (Object.hasOwnProperty.call(this.unitScript, key) && this.unitScript[key]) {
        this.unitScript[key].init()
      }
    }
  }
  // 渲染
  render() {
    // 类初始化
    for (const key in this.unitScript) {
      if (Object.hasOwnProperty.call(this.unitScript, key) && this.unitScript[key] && !window.app.info.noRenderList.includes(key)) {
        this.unitScript[key].render()
      }
    }
    window.app.info.noRenderList = []
    if (this.isM) this.initMobile()
    this.updatePatterView()
  }
  // 款式参数弹出框
  renderPattern(params) {
    // mode { 0: 没有按钮 1: 购物车和立即购买  2： 购物车 3： 立即购买 } 显示哪个按钮
    let mode = params.mode || 1
    mode = this.hasBuyOn ? 0 : mode
    if (!this.isShop) mode = 0
    switch (mode) {
      case 0:
        this.patternModal.$footer.style.display = 'none'
        break
      case 2:
        this.patternModal.$submitWrap.style.display = 'none'
        break
      case 3:
        this.patternModal.$cancelWrap.style.display = 'none'
        break
      default:
        break
    }
    this.setBtnDisable()
    this.updatePatterView()
    this.patternModal.open()
  }
  setBtnStyleDisable(){
    this.patternModal.$cancel.setAttribute('disabled', 'disabled')
    this.patternModal.$cancel.classList.add('btn-disabled')
    this.patternModal.$submit.setAttribute('disabled', 'disabled')
    this.patternModal.$submit.classList.add('btn-disabled')
    this.patternModal.$cancel.classList.add('d-none')
    this.patternModal.$submit.classList.add('d-none')
  }
  cancelBtnDisable(){
    this.patternModal.$submit.removeAttribute('disabled')
    this.patternModal.$cancel.removeAttribute('disabled')
    this.patternModal.$cancel.classList.remove('btn-disabled')
    this.patternModal.$submit.classList.remove('btn-disabled')
    this.patternModal.$cancel.classList.remove('d-none')
    this.patternModal.$submit.classList.remove('d-none')
  }
  setBtnDisable(){
    // console.log('movebtn')
    if(window.app.info.productDetail&&window.app.info.productDetail.pattern&&window.app.info.productDetail.pattern.every(a=>a.selling_price===0)){
      this.setBtnStyleDisable()
    }
    if(window?.app?.info?.productDetail?.is_pattern){
      if (window.app.info.productDetail.min_price <= 0 || !window.app.info.productDetail.is_match_paramter) {
        this.setBtnStyleDisable()
      }else{
        this.cancelBtnDisable()
      }
      if(window?.app?.info?.productDetail?.is_discount){
        if (window?.app?.info?.productDetail?.discount_price <= 0) {
          this.setBtnStyleDisable()
        }else{
          this.cancelBtnDisable()
        }
      }
    }
  }
  updatePatterView() {
    if (!this.patternModal) return
    const $header = this.patternModal.$target.querySelector('.unit-detail_pattern-group-header')
    const $img = $header.querySelector('.unit-detail_pattern-group-image img')
    const $price = $header.querySelector('.unit-detail_pattern-group-price')
    const $attr = $header.querySelector('.unit-detail-pattern__attr')
    if (this.$dom.querySelector('.unit-detail-price--prices')) $price.innerHTML = this.$dom.querySelector('.unit-detail-price--prices').innerHTML
    if (this.$dom.querySelector('.unit-detail-pattern__attr-items')) $attr.innerHTML = this.$dom.querySelector('.unit-detail-pattern__attr-items').innerHTML
    if (window.app.info.productDetail.thumb) $img.src = window.app.info.productDetail.thumb
  }
  // 初始化款式参数组
  getPatternGroup() {
    const $div = document.createElement('div')
    $div.classList.add('unit-detail_pattern-group')
    $div.innerHTML = `
      <div class="unit-detail_pattern-group-header">
        <div class="unit-detail_pattern-group-image"><img src="${window.app.info.page.detail_thumb}" class="img-fluid" /></div>
        <div class="unit-detail_pattern-group-info">
          <div class="unit-detail_pattern-group-price"></div>
          <div class="unit-detail-pattern__attr"></div>
        </div>
      </div>
      <div class="unit-detail_pattern-group-body"></div>
    `
    const $body = $div.querySelector('.unit-detail_pattern-group-body')
    const $pattern = this.$dom.querySelector('.unit-detail-pattern__items')
    const $quantity = this.$dom.querySelector('.unit-detail-quantity')
    if ($pattern) $body.appendChild($pattern)
    if ($quantity) $body.appendChild($quantity)
    return $div
  }
  // 询盘按钮特殊处理
  calcInquiryBtn($el) {
    const is_only_inquiry = window.app.info.productDetail.config.button_authority.length == 1 && window.app.info.productDetail.config.button_authority[0] == 'inquiry'
    if (this.isShop && !is_only_inquiry && window.app.info.productDetail.min_price > 0) {
      $el.querySelector('.btn').innerHTML = `<span class="iconfont icon-pinglun"></span>`
      $el.querySelector('.btn').classList.remove('btn')
    } else {
      this.$iconGroup.style.width = "100%"
      $el?.classList.add('full')
    }
  }
  calcQuoteBtn() {
    if (!(this.isShop && window.app.info.productDetail.min_price > 0) || window.app.info.productDetail.config.button_authority.length < 2) {
      const $quote = this.$dom.querySelector('.unit-detail-button-quote')
      if ($quote) this.$iconGroup.append($quote)
    }
  }
  checkStatus() {
    let detailPopupNode = document.getElementById('detail-popup')
    if (this.params.templateStatus === 1 && !detailPopupNode) {
      detailPopupNode = document.createElement('div')
      detailPopupNode.innerHTML = `
      <div class="unit-detail-popup__window">
        <div class="unit-detail-popup__content">
          <div><img src="https://img.yfisher.com/design/loading1.gif"></div>
          <div class="progress"><div class="progress-bar"></div></div>
          <div>${window.app.utilts.$t('The product details page is being generated. <br>You can view the generated results later.')}</div>
          <div class="unit-detail-popup__button">
            <a class="refresh-button btn" href="">
              <div class="d-inline-block">
                <span class="iconfont icon-refresh"></span> ${window.app.utilts.$t('Refresh page')}
              </div>
            </a>
            <a class="goback-button btn" href="./">
              <div class="d-inline-block">${window.app.utilts.$t('Return to Home')}</div>
            </a>
          </div>
        </div>
      </div>`

      detailPopupNode.setAttribute('id', 'detail-popup')
      detailPopupNode.className = "unit-detail-popup__window-wrap show"
      document.body.appendChild(detailPopupNode)
      document.body.style.overflow = 'hidden'

      const self = this
      this.loadingTimeout = setInterval(async function(){
        const pageData = await self.getPageData()
        if (pageData.data.content.template_status > 2) {
          clearInterval(self.loadingTimeout)
          self.loadingTarget = 300
        }
      }, 10 * 1000)

      setTimeout(() => self.runProgress(), 100)
    }
  }
  runProgress() {
    const self = this
    const $bar = document.getElementById('detail-popup').querySelector('.progress-bar')
    let currentWidth = parseFloat($bar.style.width || 0)
    currentWidth = currentWidth + (this.loadingTarget - currentWidth) / 150
    $bar.style.width = (currentWidth > 100 ? 100 : currentWidth) + '%'
    if (currentWidth >= 100) window.location.reload()
    else setTimeout(() => self.runProgress(), 100)
  }
  /** 获取页面数据 */
  getPageData() {
    return new Promise((resolve, reject) => {
      const params = {
        url_path: window.app.info.page.page_url,
        site_id: window.app.info.site.site_id,
        language_code: window.app.info.site.language_code
      }
      this.utilts.request({
        url: '/page-url/find-by-path-with-content',
        method: 'POST',
        params
      }).then(res => {
        resolve(res)
      })
      .catch(error => reject(error))
    })
  }
}
