'use strict'

const API_URL = "https://brasilapi.com.br/api/cnpj/v1";

const queryForm = document.querySelector(".query-form");
const queryInputField = document.querySelector(".query-cnpj__input");
const submitQueryBtn = document.querySelector(".submit-query--btn");
const submitFormBtns = document.querySelectorAll('.submit--btn')
const editBtn = document.querySelector(".btn--edit-info");

const companyTabContainer = document.querySelector(".company-info__tab");
const shareholdersTabContainer = document.querySelector(
  ".shareholders-info__tab"
);
const companyForm = document.querySelector(".company-form");
const shareholdersForm = document.querySelector(
  ".shareholders-info__tab .shareholders-form"
);
const errorMessageContainer = document.querySelector(".error-message__box");

// Tabs
const tabBtns = document.querySelectorAll(".btn--tab");
const tabBtnsContainer = document.querySelector(".tabs-list");
const tabContainers = document.querySelectorAll(".tab-content");

// Filtros de Sócios
const filterTabContainer = document.querySelector(
  ".shareholders-filter__tab-list"
);
const filterBtns = document.querySelectorAll(".btn-filter");

// Dados da companhia
const companyName = document.getElementById("company-name");
const companyCNPJ = document.getElementById("company-cnpj");
const companyEmail = document.getElementById("company-email");
const companyDebut = document.getElementById("company-debut");
const companyActivity = document.getElementById("company-activity");
const companyAddress = document.getElementById("company-address");
const companyPhone = document.getElementById("company-phone");

const dateOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

// Formata nomes
const formatName = (name) =>
  name
    .split(" ")
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(" ");

// Estado da aplicação
let state = {
  empresa: {},
  quadroSocietario: [],
};

const validateCNPJ = function (cnpj) {
  const isValid = checkCNPJ(cnpj);

  if (!isValid) {
    queryInputField.style.border = "2px solid #dc2626";
    return false;
  }

  queryInputField.style.border = "2px solid #e4e4e7";
  return true;
};

const checkCNPJ = function (cnpj) {
  const regex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}\-?\d{2}$/;

  return regex.test(cnpj);
};

// Para ser inserido no URL de requisição,
// o CNPJ precisa estar ausente de quaisquer barras (/)
// Os demais caracteres não interferem na requisição.
const formatCNPJ = function (cnpj) {
  if (!cnpj.includes("/")) return cnpj;
  const slash = "/";
  const index = cnpj.indexOf(slash);

  // Insere temporariamente os caractéres do cnpj em um array
  // para permitir a formatação.
  const tempArray = cnpj.split("");
  tempArray.splice(index, 1);
  const newString = tempArray.join("");

  return newString;
};

// Responsável pela requisição propriamente dita.
const fetchCNPJ = async function (cnpj) {
  try {
    const res = await fetch(`${API_URL}/${cnpj}`);
    let data = await res.json();

    console.log(data);
    if (data.name === "BadRequestError") {
      state.error = "BadRequestError";
    }

    // Formata o objeto de resposta da API para algo mais objetivo
    // e compatível com JavaScript.
    // 1.
    const dataQuadroSocietario = data.qsa.map(function (socio) {
      return {
        id: socio.cnpj_cpf_do_socio,
        cargo: socio.qualificacao_socio,
        nome: formatName(socio.nome_socio),
        faixaEtaria: socio.faixa_etaria,
        dataEntrada: socio.data_entrada_sociedade,
      };
    });

    state.quadroSocietario = dataQuadroSocietario;

    // 2.
    state.empresa = {
      cnpj,
      email: data.email,
      razaoSocial: data.razao_social,
      cep: data.cep,
      atividade: data.cnae_fiscal_descricao,
      inicioAtividade: data.data_inicio_atividade,
      endereço: `${data.descricao_tipo_de_logradouro} ${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}, ${data.uf}`,
      telefone: data.ddd_telefone_1,
    };
    state.error = "";
    renderErrorMessage("");
  } catch (err) {
    console.log(err.message);
  }
};

queryForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  tabContainers.forEach((tab) => tab.classList.add("hidden"));

  const query = queryInputField.value;

  //   guard clause | valida o formato do CNPJ
  if (!query.length || !validateCNPJ(query)) return;

  // valida o formato do CNPJ

  // Carregar dados da empresa (PJ)
  await fetchCNPJ(formatCNPJ(query));

  if (!state.error) {
    // Vizualização da empresa
    renderCompanyView(state.empresa);

    // Vizualização do Quadro Societário
    renderShareholdersView(state.quadroSocietario);

    // Filtros
    renderFilterBtns(state.quadroSocietario);

    // Ativa tabs de navegação
    toggleActiveTabs();
  } else return renderErrorMessage("O CNPJ especificado não corresponde a nenhuma empresa");
});

const toggleActiveTabs = function () {
  tabBtns.forEach((tab) => tab.classList.remove("btn--tab-active"));
  tabBtnsContainer.style.opacity = "100";
  tabBtnsContainer.style.pointerEvents = "all";
  companyTabContainer.classList.remove("hidden");
};

const renderErrorMessage = function (errorMessage, error) {
  // Esconde o botão de edição, visto que não há dados para serem alterados
  editBtn.classList.add("hidden");

  errorMessageContainer.innerHTML = "";

  const markup = `<h2 class="heading-secondary error-message">
                    ${errorMessage}
                </h2>
                `;

  errorMessageContainer.insertAdjacentHTML("afterbegin", markup);
};

const renderCompanyView = function (empresa) {
  // Campos de preenchimento
  companyName.value =
    companyActivity.value =
    companyAddress.value =
    companyCNPJ.value =
    companyDebut.value =
    companyEmail.value =
    companyPhone.value =
      "";

  companyName.value = empresa.razaoSocial;
  companyEmail.value = empresa.email;
  companyActivity.value = empresa.atividade;
  companyAddress.value = empresa.endereço;
  companyCNPJ.value = empresa.cnpj;
  companyPhone.value = empresa.telefone;
  companyDebut.value = empresa.inicioAtividade;
};

const renderShareholdersView = function(quadroSocietario) {

    shareholdersForm.innerHTML = "";

     quadroSocietario.forEach((socio) => {
       let shareholdersMarkup = ` 
        <div class="shareholder__card field__box">
            <div class="field__box-content">
                <div class="field__box-separator">
                    <input class="input-field shareholder-occupation" name="shareholder-occupation" type="text" value="${socio.cargo}" required>
                    <input class="input-field shareholder-name" name="shareholder-name" type="text" value="${socio.nome}" required>
                </div>
                <div class="field__box-separator">
                    <label class="field__label">Desde:</label>
                    <input class="input-field" name="shareholder-entry-Date" type="date" value="${socio.dataEntrada}" required>
                </div>
                </div>
                <div class="field__box-content">
                <div class="field__box-separator">
                <input class="input-field shareholder-name" name="shareholder-age" type="text" value="${socio.faixaEtaria}" required>     
                <input class="input-field company-cnpj-cpf" name="shareholder-id" type="text" value="${socio.id}" required>
                </div>
                
                <button class="btn submit--btn hidden">Confirmar</button>
                </div>
        </div>
                `;

       shareholdersForm.insertAdjacentHTML("beforeend", shareholdersMarkup);
     });
}



const renderFilterBtns = function(quadroSocietario, sociosFiltrados) {
    // limpando os filtros antigos.
    filterTabContainer.innerHTML = "";

    // Cargo filtrado (caso haja filtros definidos pelo usuário)
    const cargoFiltrado = sociosFiltrados?.[0]?.cargo

    // Todos os cargos
    const cargos = quadroSocietario.map((socio) => socio.cargo);
    const cargosUnicos = new Set(cargos);

    console.log(cargoFiltrado)

    // Criando botões de filtros baseado nos cargos do quadro societário
    const btnAllOptions = `<li><button class="btn-filter ${
      cargoFiltrado ? "" : "btn-filter--active"
    } ">Todos</button></li>`;
    filterTabContainer.insertAdjacentHTML("afterbegin", btnAllOptions);

    cargosUnicos.forEach((cargo) => {
        const filterMarkup = `
                <li>
                    <button data-filter="${cargo}" class="btn-filter ${cargoFiltrado === cargo ? 'btn-filter--active' : ''}">${cargo}</button>
                </li>
            `;

    filterTabContainer.insertAdjacentHTML("beforeend", filterMarkup);
    });
}



//////////////////////////////////////////////////////////////////////            
// Funcionalidade das Tabs (Empresa e Sócios)
tabContainers.forEach((tab) => tab.classList.add('hidden'))
tabBtnsContainer.addEventListener('click', function(e) {

    const clicked = e.target.closest('.btn--tab')                

    // guard clause
    if (!clicked) return;
                
    tabContainers.forEach((tabContainer) => tabContainer.classList.add('hidden'))
                
    tabBtns.forEach((tab) => tab.classList.remove('btn--tab-active'))
                
    // Ativa o botão da tab clicada (destaca com cores diferentes)
    clicked.classList.add('btn--tab-active')
                
    // Mostra a tab baseado no atributo do botão clicado
    document.getElementById(`${clicked.dataset.tab}`).classList.remove('hidden')
                      
})
            


// Habilitando os campos para edição
const toggleInputFields = function(e) {
    e.preventDefault();

    const btns = document.querySelectorAll(".submit--btn");
    btns.forEach((btn) => btn.classList.toggle("hidden"));

    const inputs = document.querySelectorAll(".field__box .input-field");
    inputs.forEach((input) => input.classList.toggle("field-input--active"));
    console.log(inputs);
}

// Funcionalidade dos filtros
filterTabContainer.addEventListener("click", function (e) {

    const clicked = e.target.closest(".btn-filter");
    console.log(clicked);

    if (!clicked) return;

    filterBtns.forEach((btn) => btn.classList.remove("btn-filter--active"));


    // Filtra os sócios
    const filteredShareholders = state.quadroSocietario.filter(
        (socio) => socio.cargo === clicked.dataset.filter
    );

    // Atualiza os botõões de filtro para corresponder à opção selecionada
    renderFilterBtns(state.quadroSocietario, filteredShareholders);

    renderShareholdersView(filteredShareholders);

    // Caso clique em 'Todos' retornar aos estado original.
    if (!filteredShareholders.length)
        renderShareholdersView(state.quadroSocietario);
});



// Edicão de informações
editBtn.addEventListener('click', function(e) {
    toggleInputFields(e)
})
            

// Envio de dados
companyForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = new FormData(companyForm);

  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  console.log(data);

  // Exemplo de envio de dados para o servidor
  /*
    fetch('/submit-form', {
        method: 'POST',
    headers: {
    'Content-Type': 'application/json'
            },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Success:', result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
*/

    toggleInputFields(e)
})
            
shareholdersForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(shareholdersForm);

    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    console.log(data);
    toggleInputFields(e)
})