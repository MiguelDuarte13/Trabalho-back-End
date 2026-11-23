document.addEventListener("DOMContentLoaded", () => {

    // ── Esconde CTA "Criar Conta Grátis" se usuário já estiver logado ──
    const ctaSection = document.getElementById("cta-section");
    if (ctaSection && obterUsuarioLogado()) {
        ctaSection.style.display = "none";
    }

    const membros = [
        {
            nome: "Izabelle Lopes",
            cargo: "Estudante de ADS",
            descricao: "Responsável pela arquitetura e integração do sistema.",
            imagem: "../images/lucasstefanon.png"
        },
        {
            nome: "Miguel Duarte",
            cargo: "Estudante de ADS",
            descricao: "Focada em acessibilidade e experiência do usuário.",
            imagem: "../images/Amanda.jpeg"
        },
        {
            nome: "Miguel Ferreira",
            cargo: "Estudante de ADS",
            descricao: "Especialista em construção de interfaces inclusivas.",
            imagem: "../images/MiguelFerreira.jpeg"
        },
        {
            nome: "Rafaela Aquino",
            cargo: "Estudante de ADS",
            descricao: "Apaixonado por tecnologia aplicada à educação.",
            imagem: "../images/Joao.jpeg"
        },
        {
            nome: "Miguel Ferreira",
            cargo: "Estudante de ADS",
            descricao: "Responsável pela experiência visual da plataforma.",
            imagem: "../images/MiguelFerreira.jpeg"
        },
        {
            nome: "Rafaela Aquino",
            cargo: "Estudante de ADS",
            descricao: "Criadora de soluções pedagógicas digitais.",
            imagem: "../images/rafaela.jpeg"
        },
        {
            nome: "Rayssa Fernandes",
            cargo: "Estudante de ADS",
            descricao: "Contribui com recursos e funcionalidades da plataforma.",
            imagem: "../images/MiguelDuarte.jpeg"
        }
    ];

    let indiceAtual = 0;

    const secaoEquipe = document.querySelector(".equipe-section");

    secaoEquipe.innerHTML = `
        <h2 class="section-title">Nossa Equipe</h2>
        <p class="section-sub">
            Profissionais apaixonados por educação inclusiva
        </p>

        <div class="carousel">

            <button class="carousel-prev">
                &#8249;
            </button>

            <div class="carousel-cards"></div>

            <button class="carousel-next">
                &#8250;
            </button>

        </div>

        <div class="carousel-dots"></div>
    `;

    const cards = document.querySelector(".carousel-cards");
    const dots = document.querySelector(".carousel-dots");

    function renderizar() {

        const total = membros.length;

        const anterior =
            (indiceAtual - 1 + total) % total;

        const proximo =
            (indiceAtual + 1) % total;

        cards.innerHTML = `
            <div class="carousel-card carousel-card--lado">
                <img class="carousel-avatar" src="${membros[anterior].imagem}" alt="${membros[anterior].nome}">
                <h3>${membros[anterior].nome}</h3>
                <p class="membro-cargo">${membros[anterior].cargo}</p>
                <p>${membros[anterior].descricao}</p>
            </div>

            <div class="carousel-card carousel-card--ativo">
                <img class="carousel-avatar" src="${membros[indiceAtual].imagem}" alt="${membros[indiceAtual].nome}">
                <h3>${membros[indiceAtual].nome}</h3>
                <p class="membro-cargo">${membros[indiceAtual].cargo}</p>
                <p>${membros[indiceAtual].descricao}</p>
            </div>

            <div class="carousel-card carousel-card--lado">
                <img class="carousel-avatar" src="${membros[proximo].imagem}" alt="${membros[proximo].nome}">
                <h3>${membros[proximo].nome}</h3>
                <p class="membro-cargo">${membros[proximo].cargo}</p>
                <p>${membros[proximo].descricao}</p>
            </div>
        `;

        dots.innerHTML = "";

        membros.forEach((_, index) => {

            const dot =
                document.createElement("button");

            dot.classList.add("dot");

            if (index === indiceAtual) {
                dot.classList.add("dot--ativo");
            }

            dot.addEventListener("click", () => {
                indiceAtual = index;
                renderizar();
            });

            dots.appendChild(dot);
        });
    }

    document.addEventListener("click", e => {

        if (e.target.classList.contains("carousel-next")) {

            indiceAtual++;

            if (indiceAtual >= membros.length) {
                indiceAtual = 0;
            }

            renderizar();
        }

        if (e.target.classList.contains("carousel-prev")) {

            indiceAtual--;

            if (indiceAtual < 0) {
                indiceAtual = membros.length - 1;
            }

            renderizar();
        }
    });

    setInterval(() => {

        indiceAtual++;

        if (indiceAtual >= membros.length) {
            indiceAtual = 0;
        }

        renderizar();

    }, 5000);

    renderizar();
});
