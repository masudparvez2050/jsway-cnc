class ScriptDevHistory extends Script {
	constructor(params) {
		super(params)
		this.is_swiper = params.is_swiper
		this.delay = params.delay
		this.loop = params.loop
		this.attrId = params.attrId
		this.mySwiper = null; // 保存 Swiper 实例的引用
		this.prevScreenWidth = window.innerWidth; // 记录前一个屏幕宽度
		this.mr_sm = params.mr_sm
		this.mr_md = params.mr_md
		this.mr_xl = params.mr_xl
		this.screenMr = '0px'
		this.cols_xl = params.cols_xl
		this.cols_md = params.cols_md
		this.cols_col = params.cols_col
		this.cols = '12'
		this.screen = 'xl'
	}

	async init() {
		let attrId = this.attrId
		let mr_sm = this.mr_sm
		let mr_md = this.mr_md
		let mr_xl = this.mr_xl
		let cols_xl = this.cols_xl
		let cols_md = this.cols_md
		let cols_col = this.cols_col
		// let screenMr = '10px'
		let autoplay = false
		if (this.is_swiper == 1) { autoplay = { delay: this.delay, disableOnInteraction: false } }

		let yearElements = document.querySelectorAll(`#${attrId} .swiper-wrapper-year .flex-year`);
		if (this.prevScreenWidth < 768) {
			this.screenMr = mr_sm
			this.cols = cols_col
			this.screen = 'sm'
		} else if (this.prevScreenWidth >= 768 && this.prevScreenWidth < 1200) {
			this.screenMr = mr_md
			this.cols = cols_md
			this.screen = 'md'
		} else if (this.prevScreenWidth >= 1200) {
			this.screenMr = mr_xl
			this.cols = cols_xl
			this.screen = 'xl'
		}

		let viewCount = {
			'12': 1,
			'6': 2,
			'4': 3,
			'3': 4,
			'2_4': 5,
			'2': 6,
			'12_7': 7,
			'12_8': 8,
			'12_9': 9,
			'12_10': 10,
			'12_11': 11,
			'1': 12,
			'auto': 'auto'
		}
		let viewCountXl = {
			'12': 1.3,
			'6': 2.5,
			'4': 3.5,
			'3': 4.5,
			'2_4': 5.5,
			'2': 6.5,
			'12_7': 7.5,
			'12_8': 8.5,
			'12_9': 9.5,
			'12_10': 10.5,
			'12_11': 11.5,
			'1': 12.5,
		}
		// 初始化 Swiper 实例
		this.mySwiper = new Swiper(`#${attrId} .devswiper`, {
			loop: this.loop == 1,
			speed: 1000,
			// spaceBetween: this.prevScreenWidth > 1199 ? 30 : 10,
			spaceBetween: parseFloat(this.screenMr) || 0,
			slidesPerView: this.screen === 'xl' ? viewCountXl[this.cols] : viewCount[this.cols],
			// centeredSlides: !(this.prevScreenWidth > 1199),
			navigation: {
				nextEl: `#${attrId} .devswiper .next`,
				prevEl: `#${attrId} .devswiper .prev`,
			},
			autoplay,
		})

		let switchYear = (index) => {
			yearElements.forEach((el, i) => {
				el.classList.remove('on');
				if (index >= i) { el.classList.add('on'); }
				var wrapper = document.querySelector(`#${attrId} .swiper-wrapper-year`);
				if (i === index && wrapper) {
					wrapper.scroll({
						left: el.offsetLeft,
						behavior: 'smooth'
					});
				}
			})
		}

		this.mySwiper.on('transitionStart', () => {
			var activeIndex = this.mySwiper.realIndex;
			var isEnd = this.mySwiper.isEnd;
			if (isEnd) {
				yearElements.forEach(el => { el.classList.add('on'); })
			} else { switchYear(activeIndex) }
		});

		yearElements.forEach((element, index) => {
			element.addEventListener('click', () => {
				let abs = Math.abs(index - this.mySwiper.realIndex)
				if (index > this.mySwiper.realIndex) {
					for (let i = 0; i < abs; i++) {
						((i) => {
							setTimeout(() => {
								this.mySwiper.slideNext(1000 / (abs), false)
							}, 3000 / abs * i);
						})(i);
					}
				} else if (index < this.mySwiper.realIndex) {
					for (let i = 0; i < abs; i++) {
						((i) => {
							setTimeout(() => {
								this.mySwiper.slidePrev(1000 / (abs), false)
							}, 3000 / abs * i);
						})(i);
					}
				}
				switchYear(index)
			});
		});

		// 添加屏幕宽度变化的监听器
		let resetSwiper = () => {
			let currentScreenWidth = window.innerWidth;
			let screenMr = '10px';
			let screen = 'xl';
			if (currentScreenWidth < 768) {
				screenMr = mr_sm
				screen = 'sm'
				this.cols = this.cols_col
			} else if (currentScreenWidth >= 768 && currentScreenWidth < 1200) {
				screenMr = mr_md
				screen = 'md'
				this.cols = cols_md
			} else if (currentScreenWidth >= 1200) {
				screenMr = mr_xl
				screen = 'xl'
				this.cols = cols_xl
			}
			if (screen !== this.screen) {
				this.screen = screen;
				// this.mySwiper.params.spaceBetween = currentScreenWidth > 1199 ? 30 : 10;
				this.mySwiper.params.spaceBetween = parseFloat(screenMr) || 10;
				// this.mySwiper.params.centeredSlides = !(currentScreenWidth > 1199);
				this.mySwiper.params.slidesPerView = screen === 'xl' ? viewCountXl[this.cols] : viewCount[this.cols];
				this.mySwiper.update(); // 更新 Swiper 实例的配置
				this.prevScreenWidth = currentScreenWidth; // 更新前一个屏幕宽度
			}
		}
		window.addEventListener('resize', resetSwiper);
	}
}
