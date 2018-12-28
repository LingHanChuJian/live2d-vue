import message from './message'

class dialogue {
    constructor(el, customDialogue) {
        this.el = el
        this.speed = 500
        this.control = ''
        this.controlTwo = ''
        this.message = new message(customDialogue)
        this.defaultMessage()
        this.monitor()
    }

    defaultMessage() {
        this.showMessage(this.message.defaultMesssage()).then(() => this.hideMessage())
    }

    monitor() {
        this.message.monitor(msg => this.showMessage(msg), () => this.hideMessage())
    }

    showMessage(message, time = 5000) {
        if (Array.isArray(message))
            message = message[this.message.randomInteger(message.length - 1)]
        this.el.innerHTML = message
        return this.fadeIn(time)
    }

    hideMessage(time = 5000) {
        return this.fadeOut(time)
    }

    fadeIn(time) {
        return new Promise(resolve => {
            if (Number(this.el.style.opacity) < 1) {
                this.clearTimer()
                let total = 0
                this.control = setInterval(() => {
                    total += this.speed
                    this.el.style.opacity = total / time
                    if (this.el.style.opacity >= 1) {
                        this.clearTimer()
                        resolve()
                    }
                }, 30)
            }
        })
    }

    fadeOut(time) {
        return new Promise(resolve => {
            if (Number(this.el.style.opacity) >= 1) {
                this.clearTimer('controlTwo')
                this.controlTwo = setTimeout(() => {
                    this.clearTimer()
                    let total = time
                    this.control = setInterval(() => {
                        time -= this.speed
                        this.el.style.opacity = time / total
                        if (this.el.style.opacity <= 0) {
                            this.clearTimer()
                            resolve()
                        }
                    }, 30)
                }, time)
            }
        })
    }

    clearTimer(str = 'control') {
        if (str === 'control' && this.control) {
            clearInterval(this.control)
            this.control = ''
        }
        if (str !== 'control' && this.controlTwo) {
            clearTimeout(this.controlTwo)
            this.controlTwo = ''
        }
    }
}

export default dialogue