const w : number = window.innerWidth 
const h : number = window.innerHeight
const parts : number = 6  
const scGap : number = 0.06 / parts 
const strokeFactor : number = 90 
const sizeFactor : number = 6.9 
const rFactor : number = 2.9 
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