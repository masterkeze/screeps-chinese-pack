import { TRANSLATION_DIRECTION } from 'setting'

/**
 * 递归获取该元素下所有包含内容的 html 元素
 * 
 * @param el 要进行查询的 html 元素
 * @return 包含内容的 html 元素数组
 */
export const getContentElement = function (el: HTMLElement): HTMLElement[] {
    if (!el.innerText) return []
    // 下面没有子元素了，那内容就在它自己身上，直接返回
    if (el.children.length === 0) return [el]

    const contentElement: HTMLElement[] = []

    // 遍历所有子节点递归拿到内容节点
    for (const children of el.children) {
        if (!(children instanceof HTMLElement)) continue
        contentElement.push(...getContentElement(children))
    }

    return contentElement
}


/**
 * 翻译指定 html 元素
 * 
 * 会递归翻译其子元素
 * 该方法会修改 content 参数的内容（会将完成翻译的内容从 content 取出以提高性能，除非该 content 指定了 reuse）
 * 
 * @param el 要进行翻译的 html 元素
 * @param contents 翻译文本
 */
export const translate = function (el: HTMLElement, contents: TranslationContent[]): void {
    // 取出所有待翻译元素
    const needTranslateElement = getContentElement(el)

    // 遍历所有节点进行翻译
    needTranslateElement.forEach(element => {
        const originContent = element.innerHTML

        // 找到符合的翻译内容，并保存其索引
        let translationIndex: number
        const currentTranslation = contents.find((content, index) => {
            if (content[TRANSLATION_DIRECTION.from] !== originContent) return false

            translationIndex = index
            return true
        })

        // 没找到就下一个
        if (!currentTranslation) {
            // console.warn(`文本 ${originContent} 未翻译`)
            return
        }

        // 更新文本，如果没指定重用的话就将其移除
        element.innerHTML = currentTranslation[TRANSLATION_DIRECTION.to]
        if (!currentTranslation.reuse) contents.splice(translationIndex, 1)
    })
}


/**
 * 监听路由的变化
 */
export const onHashChange = function (callback: HashChangeCallback = () => {}) {
    // pushState 和 replaceState 不会触发对应的回调，这里包装一下
    history.pushState = wapperHistory('pushState')
    history.replaceState = wapperHistory('replaceState')

    // 在更新时触发回调
    const hashCallback = () => callback(document.location.hash)

    window.addEventListener('replaceState', hashCallback)
    window.addEventListener('pushState', hashCallback)
}


/**
 * 将指定方法包装上事件功能
 * 
 * @param type 要包装的方法名，会在该方法执行时发射同名的事件
 * @return 包装好的新方法
 */
const wapperHistory = function (type: string) {
    // 保存原始方法
    const originFunc = history[type]

    return function (...args) {
        const result = originFunc.apply(this, args)
        // 派发事件
        const e = new Event(type)
        window.dispatchEvent(e)
        return result
    }
}