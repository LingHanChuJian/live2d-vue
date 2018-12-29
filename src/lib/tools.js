import message from './message'

class tools {
    constructor(el, minWidth, width, position, backgroundColor, customDialogue) {
        this.parent = el
        this.control = ''
        this.width = width
        this.minWidth = minWidth
        this.position = position
        this.parent.style.width = `${width}px`
        this.parent.style.backgroundColor = backgroundColor
        if (!customDialogue) {
            this.init()
            this.hover()
        } else {
            this.customDialogue = customDialogue
            this.message = new message(customDialogue)
            this.init()
            this.defaultMessage()
            this.monitor()
        }
    }

    init() {
        switch (this.position) {
            case 'left':
                this.parent.style.transform = `translateX(${-Math.abs(this.minWidth - this.width)}px)`
                break
            case 'right':
                this.parent.style.transform = `translateX(${Math.abs(this.minWidth - this.width)}px) rotate(180deg)`
                break
        }
        if (this.customDialogue) {
            this.parent.innerHTML = ''
            this.parent.style.fontSize = '13px'
            this.parent.style.writingMode = 'initial'
            this.parent.style.lineHeight = '20px'
        }
    }

    hover() {
        this.parent.removeEventListener('mouseenter', () => this.showHover())
        this.parent.addEventListener('mouseenter', () => this.showHover())
        this.parent.removeEventListener('mouseleave', () => this.hideHover())
        this.parent.addEventListener('mouseleave', () => this.hideHover())
    }

    showHover() {
        switch (this.position) {
            case 'left':
                this.parent.style.transform = 'translateX(0)'
                break
            case 'right':
                this.parent.style.transform = 'translateX(0) rotate(180deg)'
                break
        }
    }

    hideHover() {
        this.init()
    }

    defaultMessage() {
        this.showMessage(this.message.defaultMesssage())
        this.hideMessage()
    }

    monitor() {
        this.message.monitor(msg => this.showMessage(msg), () => this.hideMessage())
    }

    showMessage(message) {
        this.clearTimer()
        if (Array.isArray(message))
            message = message[this.message.randomInteger(message.length - 1)]
        if(this.parent.style.fontSize)
        this.parent.innerHTML = this.createElementStr(message)
        this.showHover()
    }

    hideMessage(time = 5000) {
        this.clearTimer()
        this.control = setTimeout(() => this.hideHover(), time)
    }

    clearTimer() {
        if(this.control){
            clearTimeout(this.control)
            this.control = ''
        }
    }

    createElementStr(message){
        return `<div style="text-align: left;display: inline-block;">${message}</div>`
    }
}

export default tools