function setAttributes(root,attrs){
	Object.entries(attrs).forEach(([attr,value])=>{
		root.setAttribute(attr,value)
	})
}
function mapElementChildren(root){
	const childMap = {};
	Array.from( root.children ).forEach( child => {
		if(child.id) { childMap[child.id] = child; }
	})
	return childMap;
}

function renderElement(data, root){
	root.innerHTML = data;
	return {
		root: root,
		children: mapElementChildren(root)
	};
}

function clamp(v,a,b){
	return Math.max( Math.min(v,b) , a)
}

const toElement = (data, root)=> {
	const _root = (root instanceof HTMLElement ? root : ( typeof root === "string" ? document.createElement(root):null))
	return renderElement(data, _root ?? document.createElement("div"))
}

const ifdef = (prop, value) => prop ? value:"";

const elements = {
	"input":(props)=>toElement(`<div>Input</div>`),
	"radio":(props)=>toElement(`<div>radio</div>`),
	"text":(props)=>toElement(`<div>text</div>`),
}

class FormField {
	_page = null;
	_root = null;
	_props = {};
	_children = {};
	constructor(page,props,root,children){
		this._page = page;
		this._props = props
		this._children = children ?? {}
		this._root = root ? root : toElement(`Invalid form type :(${props.type})`,"p").root;
		page._root.appendChild(this._root)
	}
	render(){}
	get props(){ return this.props }
}

class TextField extends FormField {
	constructor(page, props){
		const text = toElement(`${props.text}`,"p")
		super(page,props,text.root,text.children)
	}
}

class InputField extends FormField {
	constructor(page, props){
		const text = toElement(`
			<label>${ props.label ?? "" }</label>
			<input ${ ifdef(props.name, "id=\""+props.name+"\"") } value="${props.value??''}"
				class="input" placeholder="${ props.placeholder ?? ''}"/>
			<span id="error"></span>
		`.trim(),"div")

		setAttributes(text.root, {
			class:"input-box"
		})

		super(page,props,text.root,text.children)
	}
}

const TypeFieldMap = {
	"text": TextField,
	"input": InputField
}

class FormPage {
	_root; _children;
	_form; _fields;
	constructor({ name, fields, navigation }, form, root = undefined){
		this._form = form;
		this._fields = fields
		if(root){
			this._root = root;
		} else {
			
			const _ele = toElement(`
				<legend>${name}</legend>
			`.trim(),"fieldset");
			this._root = _ele.root;
			this._children = _ele.children;

			this._form._root.appendChild(this._root);
		}

		this.render();
		
		//put navigation buttons
		if(navigation){

			const navigationDiv = toElement("","div").root;
			setAttributes(navigationDiv,{
				class:"btn-list"
			})

			Object.entries(navigation)//
				.forEach( ([type,name]) => {
					switch(type){
						case "next":{
							const button = toElement(`${ name }`,"a").root
							setAttributes(button, {
								href:"#",
								class:"btn"
							})

							button.onclick = () => {
								this.handleNextPage()
							}
							navigationDiv.appendChild(button)
						}break;
						case "prev":{
							const button = toElement(`${ name }`,"a").root
							setAttributes(button, {
								href:"#",
								class:"btn"
							})

							button.onclick = () => {
								this.handlePrevPage()
							}
							navigationDiv.appendChild(button)
						}break;
						case "submit":{

						}break;
						default:break;
				}
			})

			this._root.appendChild(navigationDiv)
		}
	}

	show(){
		this._root.classList.remove("hide")
	} 
	hide () {
		this._root.classList.add("hide")
	}

	render(){
		this._fields.forEach(({ type, ...props }) => {
			if(type in TypeFieldMap){
				new TypeFieldMap[type](this,props);
			} else  {
				new FormField(this,{ type, ...props})
			}
		})
	}
	handleNextPage(){
		this._form.gotoNextPage()
	}
	handlePrevPage(){
		this._form.gotoPreviousPage()
	}
}

class Form {
	_root = null;
	_pages = [];
	_currentPageIndex = 0;
	_data = {};

	constructor(pages, root = document.body){
		if(root instanceof HTMLFormElement){
			this._root = root;
		} else {
			this._root = toElement("","form");
			root.appendChild(this._root);
		}
		this._pages = pages.map( page => new FormPage(page, this));
		this.update()
	}

	update(){
		this._pages.forEach((page,index) => {
			if(index === this._currentPageIndex){page.show()} else {page.hide()}
		})
	}

	gotoNextPage() {
		this._currentPageIndex= clamp( this._currentPageIndex+1, 0, this._pages.length-1)
		this.update()
	}

	gotoPreviousPage() {
		this._currentPageIndex= clamp( this._currentPageIndex-1, 0, this._pages.length-1)
		this.update()
	}
}

const formObject = new Form([
	{
		name: "Dados do cliente",
		fields: [
			{ type:"text", text:"No formulário abaixo, descreva" },
			{ type:"input", label:"Nome", placeholder:"Seu nome"},
			{ type:"input", label:"Email", placeholder:"seu-email@email.com" }
		],
		navigation:{ next:"Próximo" }
	},
	{
		name: "Dados adcionais",
		fields: [
			{ type:"text", text:"Contenos um pouco sobre o seu trabalho" },
			{ type:"input", label:"Ramo de trabalho", placeholder:"Seu ramo de trabalho"},
			{ type:"input", label:"Email empresarial", placeholder:"email-empresarial@email.com" }
		],
		navigation:{ 
			prev:"Anterior",
			next:"Próximo"
		}
	},
	{
		name: "Dados adcionais",
		fields: [
			{ type:"text", text:"Conteúdo que deseja postar" },
			{ type:"input", label:"Título", placeholder:"EX: moda"},
			{ type:"input", label:"Descrição", placeholder:"como se vestir" }
		],
		navigation:{ 
			prev:"Anterior",
			next:"Próximo"
		}
	},
], document.getElementById("form1"))

