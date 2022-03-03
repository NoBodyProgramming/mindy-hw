var dataUrl = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php"
var gameUrl = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php"
var picUrl = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/"
var showPokemon = ["bulbasaur", "charmander", "squirtle"]
var pokeData = ""

const loadData = () => {
    var pokedex = document.getElementById("pokedex-view");
    var req = new XMLHttpRequest();

    req.addEventListener("readystatechange",function(){
        if(this.readyState == 4 && this.status == 200){
            //parse and display data
            var data = req.responseText;
            pokeData = data
            pokeData = pokeData.split(/[:\n]/)

            for(p in pokeData){
                if(p % 2 == 1){
                    if(!(showPokemon.includes(pokeData[p]))){
                        pokedex.innerHTML += "<img src='" + picUrl + pokeData[p] + ".png' alt='pokemon' class='sprite'>"
                    } else{
                        pokedex.innerHTML += "<img src='" + picUrl + pokeData[p] + ".png' alt='pokemon' class='sprite found'>"
                    }
                }
            }
        }
    });
     
    req.open('GET', dataUrl + '?pokedex=all', true);
    req.send();
};

window.onload = () => {
    loadData();
};