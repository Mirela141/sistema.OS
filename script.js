// 1. Classe OrdemServico
class OrdemServico {
    constructor(id, cliente, equipamento, tecnico, descricao, valorEstimado, concluida = false, dataAbertura = new Date().toISOString(), dataConclusao = null) {
        this.id = id;
        this.cliente = cliente;
        this.equipamento = equipamento;
        this.tecnico = tecnico;
        this.descricao = descricao;
        this.valorEstimado = Number(valorEstimado);
        this.concluida = concluida;
        this.dataAbertura = dataAbertura;
        this.dataConclusao = dataConclusao;
    }

    // Altera estado e guarda a data/hora exata da conclusão
    concluirOS() {
        this.concluida = true;
        this.dataConclusao = new Date().toISOString();
    }

    // Método auxiliar para formatar datas no padrão DD/MM/AAAA - HH:mm
    formatarData(isoString) {
        if (!isoString) return '---';
        const data = new Date(isoString);
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        const horas = String(data.getHours()).padStart(2, '0');
        const minutos = String(data.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${ano} - ${horas}:${minutos}`;
    }

    // Retorna a estrutura HTML do card
    gerarTemplate() {
        const estadoTexto = this.concluida ? "Concluída" : "Pendente";
        const classeStatus = this.concluida ? "concluida" : "";
        const dataAberturaFormatada = this.formatarData(this.dataAbertura);
        const dataConclusaoFormatada = this.concluida ? this.formatarData(this.dataConclusao) : 'Em andamento';

        const botaoConcluir = !this.concluida 
            ? `<button class="btn-concluir" onclick="gerenciador.marcarComoConcluida('${this.id}')">Concluir OS</button>` 
            : '';

        return `
            <article class="os-card ${classeStatus}" data-id="${this.id}">
                <div class="card-header">
                    <h3>OS #${this.id} — ${this.equipamento}</h3>
                    <span class="badge-status">${estadoTexto}</span>
                </div>
                <p><strong>Cliente:</strong> ${this.cliente}</p>
                <p><strong>Técnico Responsável:</strong> ${this.tecnico}</p>
                <p><strong>Descrição:</strong> ${this.descricao}</p>
                <p><strong>Valor Estimado:</strong> R$ ${this.valorEstimado.toFixed(2)}</p>
                <hr class="card-divisor">
                <p><strong>Abertura:</strong> ${dataAberturaFormatada}</p>
                <p><strong>Conclusão:</strong> ${dataConclusaoFormatada}</p>
                ${botaoConcluir}
            </article>
        `;
    }
}

// 2. Classe GerenciadorOS
class GerenciadorOS {
    constructor() {
        this.ordens = [];
        this.filtroStatus = 'todas';
        this.termoBusca = '';
        
        this.carregarDoLocalStorage();
        this.configurarFormulario();
        this.configurarControles();
        this.atualizarInterface();
    }

    configurarFormulario() {
        const form = document.getElementById('formOS');
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const cliente = document.getElementById('cliente').value;
            const equipamento = document.getElementById('equipamento').value;
            const tecnico = document.getElementById('tecnico').value;
            const descricao = document.getElementById('descricao').value;
            const valorEstimado = document.getElementById('valorEstimado').value;

            const id = Date.now().toString().slice(-6);

            // Instancia com a dataAbertura gerada automaticamente no construtor
            const novaOS = new OrdemServico(id, cliente, equipamento, tecnico, descricao, valorEstimado);

            this.ordens.push(novaOS);
            this.salvarNoLocalStorage();
            this.atualizarInterface();

            form.reset();
        });
    }

    // Configura os ouvintes para pesquisa em tempo real e botões de filtro
    configurarControles() {
        const inputBusca = document.getElementById('inputBusca');
        inputBusca.addEventListener('input', (e) => {
            this.termoBusca = e.target.value.toLowerCase().trim();
            this.atualizarInterface();
        });

        const botoesFiltro = document.querySelectorAll('.btn-filtro');
        botoesFiltro.forEach(btn => {
            btn.addEventListener('click', (e) => {
                botoesFiltro.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filtroStatus = e.target.dataset.filtro;
                this.atualizarInterface();
            });
        });
    }

    marcarComoConcluida(id) {
        const os = this.ordens.find(item => item.id === id);
        if (os) {
            os.concluirOS();
            this.salvarNoLocalStorage();
            this.atualizarInterface();
        }
    }

    salvarNoLocalStorage() {
        localStorage.setItem('techfix_ordens', JSON.stringify(this.ordens));
    }

    carregarDoLocalStorage() {
        const dadosGuardados = localStorage.getItem('techfix_ordens');
        if (dadosGuardados) {
            const objetosSimples = JSON.parse(dadosGuardados);
            this.ordens = objetosSimples.map(obj => 
                new OrdemServico(
                    obj.id, 
                    obj.cliente, 
                    obj.equipamento, 
                    obj.tecnico || 'Não especificado', 
                    obj.descricao, 
                    obj.valorEstimado, 
                    obj.concluida,
                    obj.dataAbertura,
                    obj.dataConclusao
                )
            );
        }
    }

    // Aplica o filtro e a pesquisa antes de renderizar na tela
    atualizarInterface() {
        const listaElemento = document.getElementById('listaOS');

        const ordensFiltradas = this.ordens.filter(os => {
            // Filtro por Status
            const atendeStatus = 
                this.filtroStatus === 'todas' ? true :
                this.filtroStatus === 'pendentes' ? !os.concluida :
                this.filtroStatus === 'concluidas' ? os.concluida : true;

            // Filtro por Pesquisa (Cliente, Equipamento, Técnico ou ID)
            const termo = this.termoBusca;
            const atendeBusca = 
                os.cliente.toLowerCase().includes(termo) ||
                os.equipamento.toLowerCase().includes(termo) ||
                os.tecnico.toLowerCase().includes(termo) ||
                os.id.toLowerCase().includes(termo);

            return atendeStatus && atendeBusca;
        });

        if (ordensFiltradas.length === 0) {
            listaElemento.innerHTML = '<p>Nenhuma ordem de serviço encontrada.</p>';
            return;
        }

        listaElemento.innerHTML = ordensFiltradas
            .map(os => os.gerarTemplate())
            .join('');
    }
}

// Inicialização
const gerenciador = new GerenciadorOS();