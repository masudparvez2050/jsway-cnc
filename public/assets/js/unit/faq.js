class ScriptFaq extends Script {
	constructor(params) {
		super(params)
		this.attrId = params.attrId;
    this.$unit = document.querySelector(`#${this.attrId}`)
    // this.$item = this.$unit.querySelector('.unit-download-list__item')
		this.$doms = this.$unit.querySelectorAll(`.faq-row`);
    // 无数据时显示Nodata
		this.$noData = this.$unit.querySelector(".unit-comment__nodata")
		this.foldMethod = params.foldMethod || '1'
		this.collapseSettings = Number(params.collapseSettings) || 1
		this.faqOpenType = Number(params.faqOpenType) || 0
    this.pageInfo = JSON.parse(decodeURIComponent(params.pageInfo || '{}'))
    this.colInfo = JSON.parse(decodeURIComponent(params.colInfo || '{}'))
    this.config = JSON.parse(decodeURIComponent(params.config || '{ list: {}, faq: {} }'))
    this.clientRender = new ScriptFaqElement({
      attrId: this.attrId,
      openType: this.faqOpenType,
      colInfo: this.colInfo,
      config: this.config
    })
    this.content_type = params.content_type || 'detail'
	}
	/** 初始化，支持异步 */
	async init() {
		let _this = this;
		if (this.$doms) {
			this.$doms.forEach((item, index) => {
				const iconDom = item.querySelector('.faq-icon')
				if (index === 0 && this.foldMethod === '1') {
					item.classList.add('faq-open')
					iconDom.classList.remove('icon-action-plus')
					iconDom.classList.add('icon-action-minus')
				}
				if (this.foldMethod === '99') {
					item.classList.add('faq-open')
					iconDom.classList.remove('icon-action-plus')
					iconDom.classList.add('icon-action-minus')
				}
        if (this.faqOpenType && this.content_type !== 'detail') {
          item.classList.remove('faq-open')
          iconDom.classList.add('icon-action-plus')
          iconDom.classList.remove('icon-action-minus')
        }
        if (this.faqOpenType && this.content_type !== 'detail') return
				item.addEventListener('click', () => {
					// const iconDom = item.querySelector('.faq-icon')
					if(this.collapseSettings==2){
						const brother = this.utilts.getSiblings(this.faqOpenType && this.content_type !== 'detail' ? item.parentNode.parentNode : item.parentNode)
						brother.forEach((xd)=>{
							xd.querySelector('.faq-icon').classList.add('icon-action-plus')
							xd.querySelector('.faq-icon').classList.remove('icon-action-minus')
							xd.querySelector('.faq-row').classList.remove('faq-open')
						})
					}
					item.classList.contains('faq-open') ? item.classList.remove('faq-open') : item.classList.add('faq-open')
					if (iconDom.classList.contains('icon-action-plus')) {
						iconDom.classList.remove('icon-action-plus')
						iconDom.classList.add('icon-action-minus')
					} else {
						iconDom.classList.add('icon-action-plus')
						iconDom.classList.remove('icon-action-minus')
					}
				})
			})
		}
	}
  async renderList(params) {
    // console.log(`faq renderList`);
    const data = await window.app.getFAQListPageBySearch(params)
    window.app.info.pagination.page_number = data.page_number
    window.app.info.pagination.page_count = data.page_count
    window.app.info.pagination.page_size = data.page_size
    window.app.info.pagination.total = data.total
    // console.log('data', data);
    const $itemList = this.$unit.querySelector('.faq-module')
    if (!$itemList) return console.warn('renderList 获取不到 .faq-module')
    $itemList.innerHTML = ''
    if (data.list?.length) {
      if (this.$noData) this.$noData.classList.add('d-none')
      data.list.forEach((item, index) => {
        // const itemTemplate = this.$item.cloneNode(true)
        // itemTemplate.querySelector('a').href = !this.faqOpenType || !item.page_url_suffix ? 'javascript:;' : globalThis.Server.getRinseHref(item.page_url_suffix, window.app.info.site)
        // itemTemplate.querySelector('.faq-title-block').innerHTML = item.title
        // itemTemplate.querySelector('.faq-content').innerHTML = item.description
        $itemList.innerHTML += this.clientRender.createItem(item, index)
      })

      this.$doms = this.$unit.querySelectorAll(`.faq-row`);
      this.init()
    } else {
      if (this.$noData) this.$noData.classList.remove('d-none')
    }

  }
}

class ScriptFaqElement {
  constructor(params) {
    this.attrId = params.attrId
    // 列数信息
    this.colInfo = params.colInfo
    this.openType = params.openType
    this.config = params.config
  }
  createItem(item, subIndex) {
    try {
      const page_number = window.app.info.pagination?.page_number || 0
      const page_size = window.app.info.pagination?.page_size || 0
      const baseSeqNum = Math.max(0, (page_number - 1) * page_size)
      item.href = item.page_url_suffix
      const site = window.app.info.site
      const { cols_col, cols_md, cols_xl } = this.colInfo
      const openType = this.openType
      const { style_type_title, style_type_description } = this.config.list
      const {
        show_serial_default, show_serial_md, show_serial_xl,
        show_title_default, show_title_md, show_title_xl,
        show_symbol_default, show_symbol_md, show_symbol_xl,
        show_description_default, show_description_md, show_description_xl
      } = this.config.faq

      let html = `<div class="faq-out col-${cols_col} col-md-${cols_md} col-xl-${cols_xl}">
          <a target="${!openType || !item.href ? '_self' : '_blank'}" href="${!openType || !item.href ? 'javascript:;' : globalThis.Server.getRinseHref(item.href, site) }">
            <div class="faq-row ">
              <div class="faq-title faq-content-color ${ show_serial_default?'':'hide-serial-sm' } ${ show_serial_md?'':'hide-serial-md' } ${ show_serial_xl?'':'hide-serial-xl' }" text-style="${ style_type_title }">
                <div class="faq-index faq-title-color ">${ baseSeqNum + subIndex + 1 }</div>
                <div class="faq-title-block faq-title-color ${ show_title_default?'':'hide-title-sm' } ${ show_title_md?'':'hide-title-md' } ${ show_title_xl?'':'hide-title-xl' }">${ item.title }</div>
                <span class="faq-icon faq-content-color iconfont icon-action-plus ${ show_symbol_default?'':'hide-symbol-sm' } ${ show_symbol_md?'':'hide-symbol-md' } ${ show_symbol_xl?'':'hide-symbol-xl' }"></span>
              </div>
              <div class="faq-content faq-content-color ${ show_description_default?'':'hide-description-sm' } ${ show_description_md?'':'hide-description-md' } ${ show_description_xl?'':'hide-description-xl' }" text-style="${ style_type_description }">${ item.description }</div>
            </div>
          </a>
        </div>`

      return html
    } catch (error) {
      console.error(`ScriptFaqElement createItem error`, error);
    }
  }
}
