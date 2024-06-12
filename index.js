const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const addNodeButton = document.getElementById('addNode');
const deleteNodeButton = document.getElementById('deleteNode');
const startDijkstraButton = document.getElementById('startDijkstra');
const startNodeInput = document.getElementById('startNode');
const endNodeInput = document.getElementById('endNode');
const resultDiv = document.getElementById('result');

let nodes = []; // Tableau pour stocker les noeuds
let edges = []; // Tableau pour stocker les arêtes
let addingNode = false;  // Variable pour savoir si on est en train d'ajouter un noeud
let deletingNode = false;  // Variable pour savoir si on est en train de supprimer un noeud
let draggingNode = null;  // Variable pour stocker le noeud que l'on déplace
let connectingNode = null; // Variable pour stocker le noeud de départ de la connexion
let nodeRadius = 20; // Rayon des noeuds

canvas.addEventListener('mousedown', (event) => {
    const x = event.offsetX; // Récupérer la position X de la souris
    const y = event.offsetY; // Récupérer la position Y de la souris
    for (let node of nodes) {
        if (Math.hypot(node.x - x, node.y - y) <= nodeRadius) { // Vérifier si on clique sur un noeud
            draggingNode = node; // Stocker
            return;
        }
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (draggingNode) { // Si on déplace un noeud
        draggingNode.x = event.offsetX; // Mettre à jour la position
        draggingNode.y = event.offsetY; // Mettre à jour la position
        drawGraph();
    }
});

canvas.addEventListener('mouseup', () => {
    draggingNode = null; // Arrêter de déplacer le noeud
});

canvas.addEventListener('click', (event) => {
    const x = event.offsetX; // Récupérer la position X de la souris
    const y = event.offsetY; // Récupérer la position Y de la souris
    if (addingNode) {
        const nodeName = prompt("Entrer le noeud:");
        if (nodeName) {
            nodes.push({x, y, name: nodeName.toUpperCase(), edges: []}); // Ajouter le noeud au tableau des noeuds
            drawGraph();
            addingNode = false; // Sortir du mode ajout de noeud
        }
    } else if (deletingNode) {
        for (let i = nodes.length - 1; i >= 0; i--) {
            if (Math.hypot(nodes[i].x - x, nodes[i].y - y) <= nodeRadius) { // Vérifier si on clique sur un noeud
                let node = nodes.splice(i, 1)[0];
                edges = edges.filter(edge => edge.from !== node && edge.to !== node);
                nodes.forEach(n => n.edges = n.edges.filter(edge => edge.to !== node));
                drawGraph();
                deletingNode = false;
                return;
            }
        }
    } else {
        for (let node of nodes) {
            if (Math.hypot(node.x - x, node.y - y) <= nodeRadius) {
                if (!connectingNode) {
                    connectingNode = node; //noeud de départ de la connexion
                } else {
                    if (connectingNode !== node) { // Si le noeud cliqué est différent du noeud de départ
                        let weight = prompt("Enter edge weight:");
                        if (weight !== null) {
                            if (!isNaN(weight)) {
                                weight = Number(weight);
                                edges.push({from: connectingNode, to: node, weight}); // Ajouter l'arête au noeud de départ
                                connectingNode.edges.push({to: node, weight}); // Ajouter l'arête au noeud de destination
                                drawGraph();
                            } else {
                                alert("Entrer nombre seulement!");
                            }
                        }
                        connectingNode = null;
                    }
                }
                return;
            }
        }
    }
});

addNodeButton.addEventListener('click', () => {
    addingNode = true;
});

deleteNodeButton.addEventListener('click', () => {
    deletingNode = true;
});

startDijkstraButton.addEventListener('click', () => {
    let startNodeName = startNodeInput.value.toUpperCase(); //nom du noeud de départ
    let endNodeName = endNodeInput.value.toUpperCase(); //nom du noeud de fin
    let startNode = nodes.find(node => node.name === startNodeName);
    let endNode = nodes.find(node => node.name === endNodeName);
    if (startNode === undefined && endNode === undefined) {
        alert("Verifier le noued de depart et final")
    }
    if (startNode && endNode) {
        let {distances, previousNodes, steps} = dijkstra(startNode); // Exécuter l'algorithme de Dijkstra
        resultDiv.innerHTML = generateResultHtml(distances, previousNodes, steps, endNodeName); // Afficher les résultats
    }
});

function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "darkcyan";
    ctx.fillStyle = "darkcyan";
    ctx.font = "16px Arial";
    for (let edge of edges) {
        ctx.beginPath(); //nouveau chemin
        ctx.moveTo(edge.from.x, edge.from.y); // Déplacer le stylo à la position de départ de l'arête
        ctx.lineTo(edge.to.x, edge.to.y); // Tracer une ligne jusqu'à la position de fin de l'arête
        ctx.stroke(); // Dessiner la ligne
        ctx.closePath();  // Fermer le chemin
        let midX = (edge.from.x + edge.to.x) / 2; // Calcul position X du milieu de l'arête
        let midY = (edge.from.y + edge.to.y) / 2; // Calculla position Y du milieu de l'arête
        ctx.fillText(edge.weight, midX, midY); // Affichage du poids de l'arête au milieu


        const headlen = 10;
        const angle = Math.atan2(edge.to.y - edge.from.y, edge.to.x - edge.from.x);
        ctx.beginPath();
        ctx.moveTo(edge.to.x, edge.to.y);
        ctx.lineTo(edge.to.x - headlen * Math.cos(angle - Math.PI / 6), edge.to.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(edge.to.x, edge.to.y);
        ctx.lineTo(edge.to.x - headlen * Math.cos(angle + Math.PI / 6), edge.to.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }
    for (let node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI); //cercle noeud
        ctx.fill(); // Remplir le cercle
        ctx.strokeText(node.name, node.x - nodeRadius / 2, node.y - nodeRadius - 5); // Affiche le nom du noeud
        ctx.closePath();
    }
}

function dijkstra(startNode) {
    let distances = {}; //pour stocker les distances
    let previousNodes = {}; //pour stocker les noeuds précédents
    let unvisitedNodes = [...nodes]; //liste de noeuds non visités
    let steps = []; //Liste des étapes de l'algorithme
    for (let node of nodes) {
        distances[node.name] = Infinity; //distances à l'infini
        previousNodes[node.name] = null; //noeuds précédents à null
    }
    distances[startNode.name] = 0; //distance du noeud de départ à lui-même est de 0


    while (unvisitedNodes.length > 0) {
        unvisitedNodes.sort((a, b) => distances[a.name] - distances[b.name]); // Trier les noeuds par distance
        let currentNode = unvisitedNodes.shift(); // Retirer le noeud avec la plus petite distance
        if (distances[currentNode.name] === Infinity) break; // plus petite distance est infinie

        for (let edge of currentNode.edges) {
            let neighbor = edge.to;
            let alt = distances[currentNode.name] + edge.weight; // Calcul la nouvelle distance
            if (alt < distances[neighbor.name]) { // nouvelle distance est plus petite
                distances[neighbor.name] = alt;
                previousNodes[neighbor.name] = currentNode.name;
                steps.push({
                    node: neighbor.name,
                    distance: alt,
                    previous: currentNode.name
                });
            }
        }
    }
    return {distances, previousNodes, steps};
}

function generateResultHtml(distances, previousNodes, steps, endNodeName) {
    let html = "<h3 class='text-bg-success text-bg-light fw-bold'>Distances:</h3><ul>";
    for (let nodeName in distances) {
        html += `<li>${nodeName}: ${distances[nodeName]} (previous: ${previousNodes[nodeName]})</li>`;
    }
    html += "</ul><h3 class='text-bg-success text-bg-light fw-bold'>Étapes:</h3><ul>";
    for (let step of steps) {
        html += `<li>Noeud: ${step.node}, Distance: ${step.distance}, Previous: ${step.previous}</li>`;
    }
    html += "</ul>";

    // Affichage du chemin le plus court
    let path = []; //pour stocker le chemin le plus court
    let currentNodeName = endNodeName; // Commencer par le noeud de fin
    while (currentNodeName) {
        path.push(currentNodeName);
        currentNodeName = previousNodes[currentNodeName]; // Passer au noeud précédent
    }
    path.reverse(); // Inverser le chemin

    html += "<h3 class='text-bg-success text-bg-light fw-bold'>Chemin le plus court:</h3><p>" + path.join(" -> ") + "</p>";
    return html;
}