const jsoneditor = require('jsoneditor')
const jsonDiff = require('json-diff')
let diff_on = false;
let json_err = false

const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('json_error', () => {
  alert("CANNOT FIND DIFF IF JSON HAS ERROR")
});

const editor = document.getElementById("editor")
const editor2 = document.getElementById("editor2")
const options = {
    modes : ["tree", "code", "form"], 
    mode : "code",
    search : true,
    onValidationError : function(err){
        if(err && err.length){
            this.container.style.outline = "3px solid orangered"
            json_err = true;
            if(diff_on) myEmitter.emit('json_error');
        }else{
            json_err = false
            this.container.style.outline = "transparent"
        }
    },
    onModeChange : (mode)=>{
        console.log(mode)
    }
}
const editor_one = new jsoneditor(editor,options)
const editor_two = new jsoneditor(editor2,options)

let diff = (event)=>{
    event.target.classList.toggle("active")
    diff_on = !diff_on
    if(diff_on && json_err){
        myEmitter.emit('json_error');
        event.target.classList.toggle("active")
        diff_on = !diff_on
    }else if(diff_on && !json_err){
        document.getElementById("error_number").innerText = "19";
        document.getElementById("multiple").innerText = "(s)";
    }else{
        document.getElementById("error_number").innerText = "";
        document.getElementById("multiple").innerText = "";
    }
    // const one = editor_one.get()
    // const two = editor_two.get()
    // console.log(jsonDiff.diff(one,two))
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






// https://github.com/josdejong/jsoneditor/issues/603