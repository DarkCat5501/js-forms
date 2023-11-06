function validateEmail(email){
	return email.match("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$") !== null
}

//Validação de campos
function validateField(input){
	if(input.required){
		let error = false;
		switch(input.type){
			case "text": error = !Boolean(input.value);break;
			case "email": error = !validateEmail(input.value);break;
			case "radio": error = !input.value(); break;
			default: break;	
		}
		if(error){
			input.classList.add("error");
			return false
		}

	}
	input.classList.remove("error");
	return true;
}



/**
 * 
 * * @param {HTMLFormElement} element 
 */
function updateFormSteps(element,active_class ="page-active"){
    Array.from(element.children).forEach((stepForm,index) => {
        stepForm.classList.remove(active_class);
        if(index === element.currentStep){
            stepForm.classList.add(active_class);
        }
    });
}

/**
 * @param {HTMLFormElement} element
 */
function handleNextStep(root){	
	root.currentStep = Math.max( Math.min(root.currentStep+1, root.maxStep-1), 0 );
    updateFormSteps(root);
}

/**
 * @param {HTMLFormElement} element
 */
function handlePrevStep(root){
    root.currentStep = Math.max( Math.min(root.currentStep-1, root.maxStep-1), 0 );
    updateFormSteps(root);
}

function radioGroupsValidation(root){
	const radios = Array.from(root.querySelectorAll('input[type="radio"]'));
	const validateInternal = () => radios.some(radio => radio.checked);
	radios.forEach( radioInput => {
		radioInput.oninput = () => {
			if(validateInternal()){
				root.classList.remove("error")
			};
		}
	})

	return {
		type:"radio",
		required: true,
		value: validateInternal,
		classList: root.classList
	};
}

function setupFormStep(stepForm, rootForm){
    //listar todos os inputs do form
    const inputs = [
		//listar apenas os inputs de email e texto
		...Array.from(stepForm.querySelectorAll('input[type="text"],input[type="email"]')),
		//listar todas as text areas
		...Array.from(stepForm.querySelectorAll("textarea"))
	];
	//listar todos o sgrupos de seleção
	const radioGroups = Array.from(stepForm.querySelectorAll("div[radioGroup]"))//
		.map( root => radioGroupsValidation(root))
	

	//pegar os botões de ação
    const nextButtons = stepForm.querySelectorAll('#next, button[type="submit"]');
    const prevButtons = Array.from(stepForm.children).filter( child => child.id === "prev");
    //inplementar handle de validação
    
	
	inputs.forEach( input => input.oninput = ()=>validateField(input) )

    nextButtons.forEach(button => {
		button.onclick = () => {
			let hasError = false;
			//validar todos os campos de input
			inputs.forEach( (input) => hasError = !validateField(input) || hasError)
			//validar grupos de seleção
			radioGroups.forEach( (group) => hasError = !validateField(group) || hasError)

			if(!hasError){
				handleNextStep(rootForm);
			}
        }
    })

    prevButtons.forEach(button => {
        button.onclick = () => {
            handlePrevStep(rootForm);
        }
    })
}

/**
 * 
 * @param {HTMLFormElement} element 
 */
function loadFormStep(element){
    element.currentStep = 0;
    element.maxStep = element.children.length

    Array.from(element.children).forEach(stepForm => {
        setupFormStep(stepForm, element);
    });
    updateFormSteps(element);
}

window.onload = () => {
    const form1 = document.getElementById("form1");
    loadFormStep(form1)
}