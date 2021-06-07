const w : number = window.innerWidth 
const h : number = window.innerHeight
const parts : number = 6  
const scGap : number = 0.06 / parts 
const strokeFactor : number = 90 
const sizeFactor : number = 6.9 
const rFactor : number = 32.9 
const delay : number = 20 
const colors : Array<string> = [
    "#f44336",
    "#311B92",
    "#00C853",
    "#FFD600",
    "#0D47A1"
] 
const backColor : string = "#bdbdbd"

class ScaleUtil {
    
    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n) 
    }
    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n 
    }
}

class DrawingUtil {

    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2) 
        context.stroke()
    }

    static drawCircle(context : CanvasRenderingContext2D, x : number, y : number, r : number) {
        context.beginPath()
        context.arc(x, y, r, 0, 2 * Math.PI)
        context.fill()
    }

    static drawLineUpShooter(context : CanvasRenderingContext2D, scale : number) {
        const size : number = Math.min(w, h) / sizeFactor 
        const r : number = Math.min(w, h) / rFactor 
        const sc1 : number = ScaleUtil.divideScale(scale, 0, parts)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, parts)
        const sc3 : number = ScaleUtil.divideScale(scale, 2, parts)
        const sc4 : number = ScaleUtil.divideScale(scale, 3, parts)
        const sc5: number = ScaleUtil.divideScale(scale, 4, parts)
        const sc6 : number = ScaleUtil.divideScale(scale, 5, parts)
        const upSize : number = size * (sc1 - sc6)
        if (sc1 < 0.1 || sc6 > 0.9) {
            return 
        }
        context.save()
        context.translate(w / 2, h / 2)
        context.rotate(sc4 * Math.PI / 2)
        context.save()
        context.translate(0, -size * sc2)
        DrawingUtil.drawLine(context, -upSize / 2, 0, upSize / 2, 0)
        for (var j = 0;  j < 2; j++) {
            DrawingUtil.drawCircle(
                context,
                size * 0.5 * (1 - 2 * j),
                -r - h / 2 + (h / 2 + r) * (sc3) - (w / 2 + r) * sc5,
                r
            )
        }
        context.restore()
        context.restore()
    }

    static drawLUSNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor 
        context.strokeStyle = colors[i]
        context.fillStyle = colors[i]
        DrawingUtil.drawLineUpShooter(context, scale)
    }
}

class Stage {

    context : CanvasRenderingContext2D 
    canvas : HTMLCanvasElement = document.createElement('canvas')
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w 
        this.canvas.height = h 
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor 
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : Stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0 
    dir : number = 0 
    prevScale : number = 0 

    update(cb : Function) {
        this.scale += scGap * this.dir 
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir 
            this.dir = 0 
            this.prevScale = this.scale 
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale 
            cb()
        }
    }
}

class Animator {

    animated : boolean = false 
    interval : number 

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true 
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false 
            clearInterval(this.interval)
        }
    }
}

class LUSNode {

    next : LUSNode 
    prev : LUSNode 
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < colors.length - 1) {
            this.next = new LUSNode(this.i + 1)
            this.next.prev = this  
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawLUSNode(context, this.i, this.state.scale)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }


    getNext(dir : number, cb : Function) : LUSNode {
        var curr : LUSNode = this.prev 
        if (dir == 1) {
            curr = this.next 
        }
        if (curr) {
            return curr 
        }
        cb()
        return this 
    }
}

class LineUpShooter {

    curr : LUSNode = new LUSNode(0)
    dir : number = 1

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }
}

class Renderer {

    curr : LineUpShooter = new LineUpShooter()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    handleTap(cb : Function) {
        this.curr.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.curr.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}