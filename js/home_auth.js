/* ==========================================
   FILE: js/home_auth.js
   PURPOSE: Controla os modais de Login e Registro e envia dados pro backend
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btnLogin");
    const btnRegister = document.getElementById("btnRegister");
    const btnPlayNow = document.getElementById("btnPlayNow");
    
    const authModal = document.getElementById("authModal");
    const closeModal = document.getElementById("closeModal");
    const authForm = document.getElementById("authForm");
    const modalTitle = document.getElementById("modalTitle");
    const authAction = document.getElementById("authAction");
    const raceSelectGroup = document.getElementById("raceSelectGroup");
    const submitBtn = document.getElementById("submitBtn");
    const errorMsg = document.getElementById("errorMsg");

    // Função para abrir modal em modo LOGIN
    const openLogin = () => {
        authModal.style.display = "flex";
        modalTitle.innerText = "LOGIN";
        authAction.value = "login";
        raceSelectGroup.style.display = "none";
        submitBtn.innerText = "ENTER REALM";
        errorMsg.style.display = "none";
        authForm.reset();
    };

    // Função para abrir modal em modo REGISTRO
    const openRegister = () => {
        authModal.style.display = "flex";
        modalTitle.innerText = "CREATE ACCOUNT";
        authAction.value = "register";
        raceSelectGroup.style.display = "block"; // Mostra a escolha de raça
        submitBtn.innerText = "FORGE CURSOR";
        errorMsg.style.display = "none";
        authForm.reset();
    };

    // Fechar modal no X ou fora dele
    closeModal.addEventListener("click", () => { authModal.style.display = "none"; });
    window.addEventListener("click", (e) => { if (e.target === authModal) authModal.style.display = "none"; });

    // Lógica do Submit do Formulário conectando com o PHP
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const action = authAction.value;
        const race = document.getElementById("race").value;
        
        if (username.length < 3) {
            errorMsg.innerText = "Username must be at least 3 characters.";
            errorMsg.style.display = "block";
            return;
        }

        try {
            // Prepara os dados para o POST
            const formData = new FormData();
            formData.append("action", action);
            formData.append("username", username);
            formData.append("password", password);
            if (action === "register") {
                formData.append("race", race);
            }

            // Envia para nossa API de Autenticação
            const response = await fetch("backend/api_auth.php", {
                method: "POST",
                body: formData
            });
            
            const data = await response.json();

            if (data.success) {
                // Salvando sessão basica e redirecionando
                sessionStorage.setItem("kursor_user", username);
                window.location.href = "game.php";
            } else {
                errorMsg.innerText = data.error || "Failed to enter the realm.";
                errorMsg.style.display = "block";
            }
        } catch (error) {
            console.error("Auth Error:", error);
            errorMsg.innerText = "Connection to the Void failed.";
            errorMsg.style.display = "block";
        }
    });

    // Atrelando os eventos aos botões
    if (btnLogin) btnLogin.addEventListener("click", openLogin);
    if (btnPlayNow) btnPlayNow.addEventListener("click", openLogin);
    if (btnRegister) btnRegister.addEventListener("click", openRegister);
});