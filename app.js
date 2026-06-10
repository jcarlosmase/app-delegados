const output = document.getElementById("output");

function log(message) {
    output.textContent += `${message}\n`;
}

function clearLog() {
    output.textContent = "";
}

function randomChallenge(length = 32) {
    return crypto.getRandomValues(new Uint8Array(length));
}

function bufferToBase64(buffer) {
    return btoa(
        String.fromCharCode(...new Uint8Array(buffer))
    );
}

function base64ToBuffer(base64) {
    return Uint8Array.from(
        atob(base64),
        c => c.charCodeAt(0)
    );
}

async function isWebAuthnSupported() {
    return !!window.PublicKeyCredential;
}

async function isPlatformAuthenticatorAvailable() {
    if (!window.PublicKeyCredential) {
        return false;
    }

    try {
        return await PublicKeyCredential
            .isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
        return false;
    }
}

/**
 * REGISTRO DEL DISPOSITIVO
 */
async function registerDevice() {

    clearLog();

    try {

        const supported = await isWebAuthnSupported();

        if (!supported) {
            log("❌ Este navegador no soporta WebAuthn");
            return;
        }

        const platformAvailable =
            await isPlatformAuthenticatorAvailable();

        if (!platformAvailable) {
            log("❌ No se detecta autenticación biométrica local");
            return;
        }

        log("✅ Autenticador biométrico disponible");
        log("⏳ Esperando confirmación del usuario...");

        const credential =
            await navigator.credentials.create({
                publicKey: {

                    challenge: randomChallenge(),

                    rp: {
                        name: "Mi Aplicación"
                    },

                    user: {
                        id: crypto.getRandomValues(
                            new Uint8Array(16)
                        ),
                        name: "usuario@example.com",
                        displayName: "Usuario"
                    },

                    pubKeyCredParams: [
                        {
                            type: "public-key",
                            alg: -7
                        },
                        {
                            type: "public-key",
                            alg: -257
                        }
                    ],

                    authenticatorSelection: {

                        // Fuerza autenticador integrado
                        authenticatorAttachment: "platform",

                        // Requiere verificación biométrica
                        userVerification: "required",

                        // Passkey residente
                        residentKey: "required"
                    },

                    timeout: 60000,

                    attestation: "none"
                }
            });

        const credentialId =
            bufferToBase64(credential.rawId);

        localStorage.setItem(
            "credentialId",
            credentialId
        );

        log("✅ Dispositivo registrado correctamente");
        log("🔐 Credencial almacenada localmente");

        console.log("Credential:", credential);

    } catch (error) {

        console.error(error);

        switch (error.name) {

            case "NotAllowedError":
                log("❌ Operación cancelada por el usuario");
                break;

            case "InvalidStateError":
                log("❌ El dispositivo ya está registrado");
                break;

            default:
                log(`❌ Error: ${error.message}`);
        }
    }
}

/**
 * LOGIN BIOMÉTRICO
 */
async function authenticateUser() {

    clearLog();

    try {

        const storedCredentialId =
            localStorage.getItem("credentialId");

        if (!storedCredentialId) {
            log("❌ No existe ningún dispositivo registrado");
            return;
        }

        log("⏳ Solicitando autenticación biométrica...");

        const assertion =
            await navigator.credentials.get({
                publicKey: {

                    challenge: randomChallenge(),

                    allowCredentials: [
                        {
                            id: base64ToBuffer(
                                storedCredentialId
                            ),
                            type: "public-key"
                        }
                    ],

                    userVerification: "required",

                    timeout: 60000
                }
            });

        log("✅ Usuario autenticado correctamente");

        console.log("Assertion:", assertion);

    } catch (error) {

        console.error(error);

        switch (error.name) {

            case "NotAllowedError":
                log("❌ Autenticación cancelada");
                break;

            case "InvalidStateError":
                log("❌ Credencial inválida");
                break;

            default:
                log(`❌ Error: ${error.message}`);
        }
    }
}

/**
 * EVENTOS
 */
document
    .getElementById("register")
    .addEventListener("click", registerDevice);

document
    .getElementById("login")
    .addEventListener("click", authenticateUser);

/**
 * COMPROBACIÓN INICIAL
 */
(async () => {

    const supported =
        await isWebAuthnSupported();

    if (!supported) {
        log("❌ WebAuthn no soportado");
        return;
    }

    const platform =
        await isPlatformAuthenticatorAvailable();

    if (platform) {
        log("✅ Biometría disponible");
    } else {
        log("⚠️ No se detecta biometría local");
    }

})();