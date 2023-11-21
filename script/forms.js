function clamp(v, a, b) {
  return Math.max(Math.min(v, b), a);
}
function setAttributes(root, attrs) {
  Object.entries(attrs).forEach(([attr, value]) => {
    root.setAttribute(attr, value);
  });
}
function mapElementChildren(root) {
  const childMap = {};
  Array.from(root.children).forEach((child) => {
    if (child.id) {
      childMap[child.id] = child;
    }
  });
  return childMap;
}
function renderElement(data, root) {
  root.innerHTML = data;
  return {
    root: root,
    children: mapElementChildren(root),
  };
}
const toElement = (data, root) => {
  const _root =
    root instanceof HTMLElement
      ? root
      : typeof root === "string"
        ? document.createElement(root)
        : null;
  return renderElement(data, _root ?? document.createElement("div"));
};

class FormField {
  /** @type {FormPage} body */
  _page = null;
  /** @type {HTMLDivElement} body */
  _root = null;
  /** @type {Record<String,any>} body */
  _props = {};
  /** @type {Record<String,HTMLElement>} body */
  _children = {};

  constructor(page, props, root, children) {
    this._page = page;
    this._props = props;
    this._children = children ?? {};
    this._root = root
      ? root
      : toElement(`Invalid form type :(${props.type})`, "p").root;
    page._root.appendChild(this._root);
  }
  render() { }
  get props() {
    return this.props;
  }
}

class TextField extends FormField {
  constructor(page, props) {
    const text = toElement(`${props.text}`, "p");
    super(page, props, text.root, text.children);
  }
}
class InputField extends FormField {
  /** @type {HTMLInputElement} */
  _field;
  /** @type {HTMLSpanElement} */
  _error;

  constructor(page, props) {
    const {
      root: element,
      children: { field, error },
    } = toElement(
      `
			<label>${props.label ?? ""}</label>
			<input id="field" 
				${props.name || 'id="' + props.name + '"'} 
				${props.name || 'name="' + props.name + '"'}
				value="${props.value ?? ""}"
				class="input" placeholder="${props.placeholder ?? ""}"/>
			<span id="error"></span>
		`.trim(),
      "div",
    );

    setAttributes(element, {
      class: "input-box",
    });
    super(page, props, element);
    field.onkeydown = (e) => this._page.handleCTRLEnter(e);
    field.oninput = (e) => this.handleInput(e);
    this._field = field;
    this._error = error;
  }

  /**
   *
   * @param {KeyboardEvent} event
   */
  handleInput(event) {
    console.log("Validation for", event.value);
    event.preventDefault();
  }
}
class RadioField extends FormField {
  /** @type {HTMLInputElement[]} */
  _option_fields = [];
  /** @type {HTMLSpanElement} */
  _error;

  constructor(page, props) {
    const {
      root: element,
      children: { error, options },
    } = toElement(
      `
			<p>${props.description}</p>
			<span id="error" class="error"></span>
			<div id="options">
			<div>
		`.trim(),
      "div",
    );

    super(page, props, element);
    this.renderOptions(options, props);
    this._error = error;
  }

  renderOptions(parent, { name, options }) {
    const randomId = String((Math.random() * 1000).toFixed(0));
    const opt_name = name || randomId;
    this._option_fields = options.map((option, index) => {
      const opt_id = `${opt_name}_${index}`;
      const { root: element, children: data } = toElement(
        `
					<input id="${opt_id}" type="radio" name="${opt_name}" value="${index}"/>
					<label for="${opt_id}">${option}</label>
				`,
        "div",
      );
      const opt_field = data[opt_id];
      opt_field.oninput = (e) => this.handleInput(e, index);
      opt_field.onkeydown = (e) => this._page.handleCTRLEnter(e);
      parent.appendChild(element);
      return opt_field;
    });
  }

  handleInput(event, opt_index) {
    console.log("Validation for", event, opt_index);
  }
}
class MultiSelectField extends FormField {
  /** @type {HTMLInputElement[]} */
  _option_fields = [];
  /** @type {HTMLSpanElement} */
  _error;

  constructor(page, props) {
    const {
      root: element,
      children: { error, options },
    } = toElement(
      `
			<p>${props.description}</p>
			<span id="error" class="error"></span>
			<div id="options">
			<div>
		`.trim(),
      "div",
    );
    super(page, props, element);
    this.renderOptions(options, props);
    this._error = error;
  }

  renderOptions(parent, { name, options }) {
    const randomId = String((Math.random() * 1000).toFixed(0));
    const opt_name = name || randomId;
    this._option_fields = options.map((option, index) => {
      const opt_id = `${opt_name}_${index}`;
      const { root: element, children: data } = toElement(
        `
				<input id="${opt_id}" type="checkbox" name="${opt_name}" value="${index}"/>
				<label for="${opt_id}">${option}</label>
			`,
        "div",
      );
      const opt_field = data[opt_id];
      opt_field.oninput = (e) => this.handleInput(e, index);
      opt_field.onkeydown = (e) => this._page.handleCTRLEnter(e);
      parent.appendChild(element);
      return opt_field;
    });
  }

  handleInput(event, opt_index) {
    console.log("Validation for", event, opt_index);
  }
}
class ComboField extends FormField {
  /** @type {HTMLInputElement[]} */
  _option_fields = [];
  /** @type {HTMLDivElement[]} */
  _option_divs = [];
  /** @type {string[]} */
  _option_names = [];
  /** @type {HTMLDivElement} */
  _menu;
  /** @type {HTMLInputElement} */
  _search;
  /** @type {HTMLSpanElement} */
  _error;
  _focus = false;

  constructor(page, props) {
    //searchbox
    const {
      root: searchbox,
      children: { search, search_button },
    } = toElement(
      `
			<input id="search" type="text" placeholder="${props.placeholder ?? ""}"/>
			<span id="search_button">${props.search}</span>`,
      "div",
    );
    setAttributes(searchbox, { class: "combo-search" });

    //body
    const {
      root: body,
      children: { error },
    } = toElement(
      `
		<p>${props.description}:</p>
		<span id="error" class="error"></span>
		`.trim(),
      "div",
    );
    setAttributes(body, { class: "combo" });

    //menu
    const { root: menu } = toElement("", "div");
    setAttributes(menu, { class: "combo-menu hide" });

    body.appendChild(searchbox);
    body.appendChild(menu);

    super(page, props, body);
    this._menu = menu;
    this._search = search;

    //handle focus of elements
    menu.onfocus = () => this.gainFocus();
    menu.onblur = () => this.loseFocus();
    search.onfocus = () => this.gainFocus();
    search.onblur = () => this.loseFocus();

    //search handling
    search.oninput = (e) => this.handleSearch();

    this.renderOptions(this._menu, props);
    this._error = error;
  }

  renderOptions(parent, { name, options }) {
    const randomId = String((Math.random() * 1000).toFixed(0));
    const opt_name = name || randomId;
    const opts = options.map((option, index) => {
      //TODO USE SELECT
      const opt_id = `${opt_name}_${index}`;
      const { root: div, children: data } = toElement(
        `
					<input id="${opt_id}" type="radio" name="${opt_name}" value="${index}"/>
					<label for="${opt_id}">${option}</label>
				`,
        "div",
      );
      const opt_field = data[opt_id];
      //handle focus inside div
      opt_field.onfocus = () => this.gainFocus();
      opt_field.onblur = () => this.loseFocus();

      opt_field.oninput = (e) => this.handleInput(e, index);
      opt_field.onkeydown = (e) =>
        this._page.handleCTRLEnter(e, (e) => {
          this.handleInput(e, index);
        });
      parent.appendChild(div);
      return [opt_field, div, option];
    });

    this._option_fields = opts.map((opt) => opt[0]);
    this._option_divs = opts.map((opt) => opt[1]);
    this._option_names = opts.map((opt) => opt[2]);
  }
  gainFocus() {
    this._focus = true;
    this.showMenu();
  }
  loseFocus() {
    this._focus = false;
    setTimeout(() => {
      if (!this._focus) this.hideMenu();
    }, 100);
  }

  showMenu() {
    this._menu.classList.remove("hide");
  }
  hideMenu() {
    this._menu.classList.add("hide");
    this._option_divs.forEach((field) => {
      field.classList.remove("hide");
      setAttributes(field, { disabled: false });
    });
  }

  handleSearch() {
    const searchTerm = this._search.value;
    this._option_divs.forEach((field, index) => {
      const like =
        this._option_names[index].match(RegExp(`.*${searchTerm}.*`, "i")) !==
        null;
      //show or hide the option
      [
        () => {
          field.classList.add("hide");
          setAttributes(field, { tabindex: "-1" });
        },
        () => {
          field.classList.remove("hide");
          setAttributes(field, { tabindex: "" });
        },
      ][Number(like)]();
    });
  }

  handleInput(event, opt_index) {
    if (event.target.checked) {
      this._search.value = this._option_names[opt_index];
    }
  }
}

const TypeFieldMap = {
  text: TextField,
  input: InputField,
  radio: RadioField,
  multiselect: MultiSelectField,
  combobox: ComboField,
};

class FormPage {
  /**@type {HTMLFieldSetElement|null} */
  _root = null;
  /**@type {Form|null} */
  _form = null;
  /**@type {Record<String,HTMLElement>} */
  _children = {};
  /**@type {Record<String,any>} */
  _fields = {};

  _over = false; //indicates that the mouse is over the element

  constructor({ name, fields, navigation }, form, root = undefined) {
    this._form = form;
    this._fields = fields;
    if (root) {
      this._root = root;
    } else {
      const _ele = toElement(
        `
				<legend>${name}</legend>
			`.trim(),
        "fieldset",
      );
      this._root = _ele.root;
      this._children = _ele.children;
      this._form._root.appendChild(this._root);
    }
    this._render();

    this._root.onkeydown = (e) => this.handleCTRLEnter(e);
    this._root.onmouseover = () => {
      this._over = true;
    };
    this._root.onmouseleave = () => {
      this._over = false;
    };
    window.addEventListener("keydown", (e) => {
      if (this._over) {
        this.handleCTRLEnter(e);
      }
    });
    //put navigation buttons
    if (navigation) {
      const navigationDiv = toElement("", "div").root;
      setAttributes(navigationDiv, {
        class: "btn-list",
      });
      Object.entries(navigation) //
        .forEach(([type, name]) => {
          switch (type) {
            case "next":
              {
                const button = toElement(`${name}`, "a").root;
                setAttributes(button, {
                  href: "#",
                  class: "btn",
                });
                button.onclick = () => {
                  this.handleNextPage();
                };
                navigationDiv.appendChild(button);
              }
              break;
            case "prev":
              {
                const button = toElement(`${name}`, "a").root;
                setAttributes(button, {
                  href: "#",
                  class: "btn",
                });
                button.onclick = () => {
                  this.handlePrevPage();
                };
                navigationDiv.appendChild(button);
              }
              break;
            case "submit":
              {
                const button = toElement(`${name}`, "button").root;
                setAttributes(button, {
                  type: "submit",
                  class: "btn",
                });
                button.onclick = () => {
                  this.handleSubmit();
                };
                navigationDiv.appendChild(button);
              }
              break;
            default:
              break;
          }
        });
      this._root.appendChild(navigationDiv);
    }
  }

  show() {
    this._root.classList.remove("hide");
  }
  hide() {
    this._root.classList.add("hide");
  }

  _render() {
    this._fields.forEach(({ type, ...props }) => {
      if (type in TypeFieldMap) {
        new TypeFieldMap[type](this, props);
      } else {
        new FormField(this, { type, ...props });
      }
    });
  }
  handleNextPage() {
    this._form.gotoNextPage();
  }
  handlePrevPage() {
    this._form.gotoPreviousPage();
  }
  handleSubmit() {
    this._form.handleSubmit();
  }

  /**@param {KeyboardEvent} e */
  handleCTRLEnter(e, callback) {
    //handle CTRL + Enter
    const tag = e.target.tagName;
    if (e.code === "Enter" && !["A", "BUTTON"].includes(tag)) {
      const inputType = e.target.type;
      if (e.ctrlKey && !e.shiftKey) {
        this.handleNextPage();
      } else if (e.ctrlKey && e.shiftKey) {
        this.handlePrevPage();
      } else if (["checkbox", "radio"].includes(inputType)) {
        e.target.checked = Boolean(e.target.checked) ? "false" : "true";
      }
      if (callback) {
        callback(e);
      } else {
        e.preventDefault();
      }
    }
  }
}

class Form {
  /**@type {HTMLFormElement|null} */
  _root = null;
  /**@type {FormPage[]} */
  _pages = [];
  /**@type {number} */
  _currentPageIndex = 0;
  /**@type { Record<String,any>} */
  _data = {};

  constructor(pages, root = document.body) {
    if (root instanceof HTMLFormElement) {
      this._root = root;
    } else {
      this._root = toElement("", "form");
      root.appendChild(this._root);
    }
    this._pages = pages.map((page) => new FormPage(page, this));
    this.update();
  }

  update() {
    this._pages.forEach((page, index) => {
      if (index === this._currentPageIndex) {
        page.show();
      } else {
        page.hide();
      }
    });
  }

  gotoNextPage() {
    this._currentPageIndex++;
    if (this._currentPageIndex >= this._pages.length) {
      this.handleSubmit();
    } else {
      this.update();
    }
    this._currentPageIndex = clamp(
      this._currentPageIndex,
      0,
      this._pages.length - 1,
    );
  }

  gotoPreviousPage() {
    this._currentPageIndex = clamp(
      this._currentPageIndex - 1,
      0,
      this._pages.length - 1,
    );
    this.update();
  }

  handleSubmit(e) {
    //prevenir envio de submissão do form
    const event = e ?? window.event;
    event.preventDefault();
    //validate
    if (true) {
      this._root?.submit();
    }
  }
}
