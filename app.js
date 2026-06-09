const output = document.getElementById("output");

function log(msg) {
    output.textContent += msg + "\n";
}

function randomChallenge(length = 32) {
    return crypto.getRandomValues(new Uint8Array(length));
}

document.getElementById("register").onclick = async () => {

    try {

        const publicKey = {
            challenge: randomChallenge(),

            rp: {
                name: "Mi Web"
            },

            user: {
                id: crypto.getRandomValues(new Uint8Array(16)),
                name: "usuario@test.com",
                displayName: "Usuario Demo"
            },

            pubKeyCredParams: [
                {
                    type: "public-key",
                    alg: -7
                }
            ],

            authenticatorSelection: {
                userVerification: "required"
            },

            timeout: 60000,

            attestation: "none"
        };

        const credential =
            await navigator.credentials.create({
                publicKey
            });

        localStorage.setItem(
            "credentialId",
            btoa(
                String.fromCharCode(
                    ...new Uint8Array(credential.rawId)
                )
            )
        );

        log("Dispositivo registrado");

    } catch (e) {
        console.error(e);
        log("Error registro: " + e.message);
    }
};

document.getElementById("login").onclick = async () => {

    try {

        const storedId =
            localStorage.getItem("credentialId");

        if (!storedId) {
            log("No hay credencial registrada");
            return;
        }

        const credentialId =
            Uint8Array.from(
                atob(storedId),
                c => c.charCodeAt(0)
            );

        const publicKey = {

            challenge: randomChallenge(),

            allowCredentials: [
                {
                    id: credentialId,
                    type: "public-key"
                }
            ],

            userVerification: "required",

            timeout: 60000
        };

        const assertion =
            await navigator.credentials.get({
                publicKey
            });

        log("Usuario autenticado");
        console.log(assertion);

    } catch (e) {
        console.error(e);
        log("Error login: " + e.message);
    }
};