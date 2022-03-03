/*
Name: Mindy Cheng
Date: 03.04.22
Section: CSE 154 AB

This is the js file for my pokedex html page. It implements the required
features for pokedex: card-view, battle, flee, etc.
*/
"use strict";
(function(){
    // Helper functions
    function $(id){ return document.getElementById(id); }
    function qsa(className) { return document.querySelectorAll(className); }
    function qs(className) { return document.querySelector(className); }

    // Initialize global variables: found pokemons, game-id and player-id
    let found = {};
    let guid, pid;
    window.onload = function(){
        getPokemons();
        $("start-btn").onclick = gameStart;
        $("endgame").onclick = reset;
        $("flee-btn").onclick = flee;
    };
    
    // Gets all Pokemons from pokedex api.
    // Players can pick Pokemons to have a card view.
    function getPokemons(){
        let url = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php?pokedex=all";
        fetch(url) 
           .then(checkStatus)
           .then(function(responseJSON) {
                let pokemons = responseJSON.split("\n");
                for (let i = 0; i < pokemons.length; i++) {
                    let name = pokemons[i].split(":")[0];
                    let image = pokemons[i].split(":")[1];
                    let sprite = document.createElement("img");
                    sprite.src = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/" + image + ".png";
                    sprite.id = name;
                    sprite.alt = name;
                    sprite.classList.add("sprite");
                    sprite.onclick = viewPokemon;
                    // If the Pokemon is one of three starter Pokemons, make it found
                    if (name == "Bulbasaur" || name == "Charmander" || name == "Squirtle") {
                        found[name] = true;
                        sprite.classList.add("found");
                    } else {
                        found[name] = false;
                    }
                    $("pokedex-view").appendChild(sprite);
                }
            })
           .catch(function(error) {
               alert(error);
           });
    }

    // Pop out the card-view when the player clicks on a Pokemon.
    // If the selected Pokemon is found, pop out the "start a battle" button.
    function viewPokemon() {
        $("start-btn").classList.add("hidden");
        let url = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php?pokemon=" + this.id;        
        fetch(url)
            .then(checkStatus)
            .then(JSON.parse)
            .then(function(response) {
                viewDetails(response, "#p1");
            });
        if (found[this.id]) {
            $("start-btn").classList.remove("hidden");
        }
    }

    // View the details including HP, name, description, images, and moves
    // Show the details onto the card on the given side (my-side or their-side)
    function viewDetails(response, side) {
        let url = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
        qs(side + " .card>.type").src = url + response.images.typeIcon;
        qs(side + " .card>.weakness").src = url + response.images.weaknessIcon;
        qs(side + " .name").innerHTML = response.name;
        qs(side + " .info").innerHTML = response.info.description;
        qs(side + " .hp").innerHTML = response.hp + "HP";
        qs(side + " .hp").id = response.hp;
        qs(side + " .pokepic").src = url + response.images.photo;
        let moves = response.moves;
        let buttons = qsa(side + " .moves button");
        let dp = qsa(side + " .moves button .dp");
        let abilities = qsa(side + " .moves button .move");
        let move_img = qsa(side + " .moves button>img");
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove("hidden");
            buttons[i].disabled = true;
            if (i < moves.length) {
                move_img[i].src = url + "icons/" + moves[i].type + ".jpg";
                if (moves[i].dp !== undefined) {
                    dp[i].innerHTML = moves[i].dp + " DP";
                } else {
                    dp[i].innerHTML = "";
                }
                abilities[i].innerHTML = moves[i].name;
            } else {
                buttons[i].classList.add("hidden");
            }
        }   
    }

    // Start a game. Make a POST request to the game-api
    // Get card view for the opponent's Pokemon
    // The player could either choose a move of the Pokemon or flee the game
    function gameStart() {
        $("pokedex-view").classList.add("hidden");
        $("start-btn").classList.add("hidden");
        $("p2").classList.remove("hidden");
        $("results-container").classList.remove("hidden");
        let my_pokemon = qs("#p1 .name").innerHTML;
        let my_side = new FormData();
        my_side.append("startgame", true);
        my_side.append("mypokemon", my_pokemon);
        let url = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php";
        fetch(url, {method: "POST", body: my_side})
            .then(checkStatus)
            .then(JSON.parse)
            .then(function(response) {
                guid = response.guid;
                pid = response.pid;
                viewDetails(response.p2, "#p2");
                $("flee-btn").classList.remove("hidden");
                $("flee-btn").disabled = false;
                qs("#p1 .hp-info").classList.remove("hidden");
            })
            .catch(function(error) {
                alert(error);
            });
        // Set up all moves
        let moves = qsa("#p1 .card button");
        for (let i = 0; i < moves.length; i++) {
            moves[i].disabled = false;
            moves[i].onclick = battle;
        }
        $("p1-turn-results").classList.remove("hidden");
        $("p2-turn-results").classList.remove("hidden");
    }

    // Add the chosen move to the POST request.
    function battle() {
        let my_move = new FormData();
        let move_name = this.childNodes[1].innerHTML;
        move_name = move_name.replace(/\s/g, '').toLowerCase();
        my_move.append("movename", move_name);
        gameDetail(my_move);
    }

    // Add the flee move to the POST request.
    function flee() {
        let move = new FormData();
        move.append("move", "flee");
        gameDetail(move);
    }

    // Get the result of the POST request and update the status to the card-view
    // If the game is over, pop out the "back-to-box" button.
    function gameDetail(move) {
        let url = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php";
        move.append("guid", guid);
        move.append("pid", pid);
        $("loading").classList.remove("hidden");
        fetch(url, {method: "POST", body: move})
            .then(checkStatus)
            .then(JSON.parse)
            .then(function (response) {
                $("loading").classList.add("hidden");
                updateHealth(response.p1, "#p1");
                updateHealth(response.p2, "#p2");
                $("p1-turn-results").innerText = "Player1 played " + 
                    response.results["p1-move"] + " and " + response.results["p1-result"];
                if (response.results["p2-move"] == "" || response.p1["current-hp"] == 0) {
                    $("endgame").classList.remove("hidden");
                    $("flee-btn").disabled = true;
                    let moves = qsa("#p1 .card button");
                    for (let i = 0; i < moves.length; i++) {
                        moves[i].disabled = true;
                    }
                } 
                if (response.results["p2-move"] == "") {
                    $("p2-turn-results").innerText = "";
                    if (response.p2["current-hp"] == 0) {
                        $(response.p2.name).classList.remove("unfound");
                        found[response.p2.name] = true;
                    }
                } else {
                    $("p2-turn-results").innerText = "Player2 played " + 
                        response.results["p2-move"] + " and " + response.results["p2-result"];
                }
            })
            .catch(function(error) {
                alert(error);
            });
    }

    // Update the HP and the health bar.
    // If the health is below 20%, make the health-bar red.
    function updateHealth(response, side) {
        qs(side + " .hp").innerHTML = response["current-hp"] + "HP";
        let percentage = response["current-hp"] / response.hp;
        let healthBar = qs(side + " .health-bar");
        healthBar.style.width = percentage * 100 + "%";
        healthBar.classList.remove("low-health");
        if (percentage <= 0.2) {
            healthBar.classList.add("low-health");
        }
    }

    // Reset all buttons, status, and text to the original state.
    function reset() {
        $("p1-turn-results").innerText = "";
        $("p2-turn-results").innerText = "";
        $("p1-turn-results").classList.add = ("hidden");
        $("p2-turn-results").classList.add = ("hidden");
        $("endgame").classList.add("hidden");
        $("results-container").classList.add("hidden");
        $("pokedex-view").classList.remove("hidden");
        $("start-btn").classList.remove("hidden");
        $("p2").classList.add("hidden");
        qs("#p1 .hp-info").classList.add("hidden");
        $("flee-btn").classList.add("hidden");
        let reset_hp = {"current-hp":qs("#p1 .hp").id, "hp":qs("#p1 .hp").id};
        updateHealth(reset_hp, "#p1");
        updateHealth(reset_hp, "#p2");
    }

    function checkStatus(response) {  
        if (response.status >= 200 && response.status < 300) {  
          return response.text();
        } else {  
          return Promise.reject(new Error(response.status + ": " + response.statusText)); 
        } 
      }
      
      
})();