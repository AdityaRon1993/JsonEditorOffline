const jsoneditor = require('jsoneditor')


const editor = document.getElementById("editor")
const editor2 = document.getElementById("editor2")
const options = {
    modes : ["tree", "code", "form"], 
    mode : "code",
    search : true,
    onValidationError : (err)=>{
        console.log(err)
    }
}
const editor_one = new jsoneditor(editor,options)
const editor_two = new jsoneditor(editor2,options)

let diff = (event)=>{
    event.target.classList.toggle("active")
}

const controls = Array.from( document.getElementsByClassName('control') )

controls.forEach(ele=>{
    ele.addEventListener('click',(event)=>{
        const attr = event.target.getAttribute("button-function")
        if(attr == "left"){
            editor_two.set(editor_one.get())
        }
        else{
            editor_one.set(editor_two.get())
        }
    })
})




