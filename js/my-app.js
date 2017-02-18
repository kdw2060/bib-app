// Verplichte dinges Framework7
var myApp = new Framework7({
    cache: true,
    modalPreloaderTitle: 'Even geduld',
    smartSelectBackText: 'Terug',
    modalButtonCancel: 'Annuleer',
    notificationCloseButtonText: 'Sluit',
});
var $$ = Dom7;
var view1 = myApp.addView('#view-1');
var view2 = myApp.addView('#view-2', {
    dynamicNavbar: true
});
var view3 = myApp.addView('#view-3');
var view4 = myApp.addView('#view-4');

// instellen voorkeurbib adhv opgeslagen waarde in localstorage
var voorkeurbib = myApp.formGetData('formVoorkeurbib').Bibliotheken;
    // wanneer in settings een nieuwe bib gekozen wordt, reload dan de app
    $$('#view-4 form#formVoorkeurbib').on('change', function(){
    location.reload(true);});

    // voorkeurbib ook in Tab-titels tonen
    String.prototype.capitalize = function(){
            return this.toLowerCase().replace( /\b\w/g, function (m) {
                return m.toUpperCase();
            });
        };
    var bibnaamvoorpaginatitel = voorkeurbib.capitalize();
    $$('.paginatitel').append(bibnaamvoorpaginatitel);


// lokalisering: haal afwijkende url's en dergelijk op uit configuratiebestand
//TO DO: configbestand maken en functies rond schrijven (vgln met voorkeurbib waarde uit localstorage)


// globale variabelen (bruikbaar door verschillende functies)
var aantalitems = 0;  // deze waarde wordt overschreven met 'count' uit xml
var vorigezoekterm = ""; //globale variabele om te kunnen checken of er een nieuwe zoekvraag is ingetypt of niet
var catalogusItemTitel = ""; // nodig omwille van probleem met speciale tekens bij doorgeven via functie zelf
//var catalogusItemAfbSrc = "";  voorlopig toch niet nodig
   

// Instellingen voor infinite scroll zoekresultaten
var loading = false;
var lastIndex = 10; // de facto startcijfer (1 pagina met zoekresultaten, ook al is deze nog niet geladen)
var maxItems = 200; // meer dan 200 zoekresultaten tonen we niet
var itemsPerLoad = 10; 

$$('.infinite-scroll').on('infinite', function () {
  if (loading) return;
  loading = true;
  setTimeout(function () {
    loading = false;
    if (lastIndex >= maxItems || lastIndex >= aantalitems) {
      // Nothing more to load, detach infinite scroll events to prevent unnecessary loadings
      myApp.detachInfiniteScroll($$('.infinite-scroll'));      
      return;
    }
    // vraag volgende pagina xml feed op
    var paginanummer = Math.floor((lastIndex +10)/10);
    //console.log("paginanummer is: " + paginanummer);
    searchabl(paginanummer);
    myApp.showIndicator();
  }, 1000);
});  


////////////////////
//TAB 1 nieuwsfeed//
////////////////////
var myFeed = myApp.feeds('.nieuwsfeed', {
    url: 'http://localhost/proxyvoorbibapp.php?url=http://'+ voorkeurbib +'.bibliotheek.be/feed',
  openIn: 'popup'
});

///////////////////
//TAB 2 catalogus//
///////////////////
function toonZoekResultaten(xml) {        
        // deze shit nodig omdat xml in verkeerd veld zit
        var xmlresponse = xml.responseText;
        //volgende 2 regels enkel nodig mocht host van php proxy nog html tags toevoegen aan begin xmlfeed
        //xmlresponse = xmlresponse.substr(22, xmlresponse.length-29);
        //xmlresponse = xmlresponse.replace(/^\s+|\s+$/g,'');
        //console.log(xmlresponse);
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlresponse, "text/xml");
        
        //foutcontrole xml-respons
        if ( typeof xmlDoc == "undefined" || xmlDoc.getElementsByTagName("count").length == 0 ) {
            console.log(xmlDoc);
            console.log("geen geldige xml of lege xml");
            $$('#filter').removeClass('toonfilter');
            $$('#filter').addClass('hidden');
            myApp.alert('Er liep iets fout, de catalogus stuurde geen resultaat door. Probeer later nog eens opnieuw.', 'O jee');
            }  
        
        //als geen fouten, dan verwerking xml-feed
        else {
            aantalitems = xmlDoc.getElementsByTagName("count")[0].childNodes[0].nodeValue;
            console.log(aantalitems);

            if (aantalitems == 0) {
                var resultList = "";
                $$('#filter').removeClass('toonfilter');
                $$('#filter').addClass('hidden');
                myApp.alert('Er werden geen zoekresultaten gevonden. Probeer een andere zoekvraag.', 'O jee');
            }
            else {     
                var resultList= "";
                var x = xmlDoc.getElementsByTagName("result");
                //console.log(x.length);

                for (var i = 0; i < x.length; i++) { 
                    var recordid = encodeURIComponent(x[i].getElementsByTagName("id")[0].childNodes[0].nodeValue);
                    var imgsrc = $(x[i]).find('url:first').text();
                    if (imgsrc == undefined || imgsrc == "") {imgsrc = "img/placeholder.png";}
                    var titel = $(x[i]).find('short-title').text();
                    var auteur = $(x[i]).find('main-author').text();
                    var summary = $(x[i]).find('summary:first').text();

                    //resultList += "<li><a href='#' class='item-link item-content' onclick='getAvailability(&#x27;" + recordid +  "&#x27;,&#x27;" + titel + "&#x27;,&#x27;" + imgsrc + "&#x27;)'>" + "<div class='item-media'>";
                    resultList += "<li><a href='#' class='item-link item-content' onclick='getAvailability(&#x27;" + recordid +  "&#x27;,&#x27;" + imgsrc + "&#x27;)'>" + "<div class='item-media'>";

                    resultList += "<img src='" + imgsrc + "' width='80'></div>"; 

                    resultList += "<div class='item-inner'><div class='item-title-row'><div class='item-title'>" + titel + "</div></div><div class='item-subtitle'>" + auteur + "</div>";

                    resultList += "<div class='item-text'>" + summary + "</div></div></a></li>";
                  }
            }

            $$('#doeldiv').append(resultList);      
            $$('#filter').removeClass('hidden');
            $$('#filter').addClass('toonfilter');
            //update lastIndexgetal i.v.m. infinite scroll functie
            lastIndex = $$('#doeldiv li').length;
            };
    
//fix voor titels met speciale tekens - omweg via globale variabele
    $$('#doeldiv a').on('click', function (e) {
        var aangekliktetitel = $$(this).find('.item-title').text();
        catalogusItemTitel = aangekliktetitel;
    });
//
}

function toonDetailscherm(recordxml, imgurl) {
    var xmlresponse = recordxml.responseText;
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlresponse, "text/xml");
    console.log(xmlresponse);
    console.log(xmlDoc);
    if ( typeof xmlDoc == "undefined" ) {
            console.log("geen geldige availability xml of lege xml");
            myApp.alert('Er liep iets fout, de beschikbaarheidsinformatie kon niet opgehaald worden. Probeer later nog eens opnieuw.', 'O jee');
            }  
    else {
        var x = xmlDoc.getElementsByTagName("location");
        var y = xmlDoc.getElementsByTagName("item");

        var coversrc = imgurl;

        var detailschermHTML = "<div class='samenvatting'><h1>" + catalogusItemTitel + "</h1><img src='" + coversrc + "'><p class='aanwezig'></div>";

    //            var aantalaanwezig = 0 ;
    //            var aantalgereserveerd = 0;
    //            var aantaluitgeleend = 0;
    //                for (var i = 0; i < y.length; i++){
    //                    var statustekst = $(y[i]).find('status').text();
    //                    if (statustekst == "Aanwezig" ) {
    //                        aantalaanwezig++;
    //                    }
    //                    if (statustekst.indexOf("items aanwezig") >= 0){
    //                        var number = parseInt(statustekst, 10);
    //                        aantalaanwezig += number;
    //                    }
    //                    if (statustekst == "Gereserveerd" ) {
    //                        aantalgereserveerd++;
    //                    }
    //                    if (statustekst.indexOf("items gereserveerd") >= 0){
    //                        var number = parseInt(statustekst, 10);
    //                        aantalgereserveerd += number;
    //                    }
    //                    if (statustekst == "Uitgeleend" ) {
    //                        aantaluitgeleend++;
    //                    }
    //                    if (statustekst.indexOf("items uitgeleend") >= 0){
    //                        var number = parseInt(statustekst, 10);
    //                        aantaluitgeleend += number;
    //                    }
    //                }
    //            detailschermHTML += aantalaanwezig + " x aanwezig</p><p class='uitgeleend'>" + aantaluitgeleend + " x uitgeleend</p><p class='gereserveerd'>" + aantalgereserveerd + " x gereserveerd</p><br></div>";

                for (var i = 1; i < x.length; i++){
                    var filiaalnaam = $(x[i]).attr('name');
                    var items = $(x[i]).find('item');
                    var itemsvanfiliaal = items.length;

                    var cardContent = "<table><tr><th>Plaats in bib</th><th>Beschikbaarheid</th></tr>";

                    for (var teller = 0 ; teller < itemsvanfiliaal; teller++) {
                        var plaats = $(items[teller]).find('subloc').text();
                        var schap = $(items[teller]).find('shelfmark').text();
                        var statusitem = $(items[teller]).find('status').text();
                        var reserveerlink = $(items[teller]).find('placehold').text();
                       
                        cardContent += "<tr><td class='plaats'>" + plaats + " - " + schap + "</td><td class='beschikbaarheid'>" + statusitem + "</td></tr>";
                    }
                    cardContent += "</table>";

                    if (reserveerlink == "") {var reserveerButton = "";}
                    else {
                        var reserveerButton = "<a class='button button-big reserveerbutton' href='#' data-holdlink=" + reserveerlink + " onclick='naarMBview(this)'>Reserveer</a>"; 
                    }

                    detailschermHTML += "<div class='card'><div class='card-header'>" + filiaalnaam + reserveerButton + "</div><div class='card-content'><div class='card-content-inner'>" + cardContent + "</div></div>" + "</div>";
                    //TO DO: betere parsing XML voorzien, nu krijg je soms dubbele of verwarrende beschikbaarheidsinformatie
                    //TO DO: extra informatieblokken zoals recensies etc. toevoegen
                }

        myApp.onPageInit('abl-detail-page', function (page) {
            $$(page.container).find('#detailscherm-content').append(detailschermHTML);
            $('td:contains("uitgeleend")').addClass('uitgeleend');
            $('td:contains("Uitgeleend")').addClass('uitgeleend');
            $('td:contains("Aanwezig")').addClass('aanwezig');
        });
        myApp.onPageBack('abl-detail-page', function (page) {
            detailschermHTML = "";
        });
        view2.router.loadPage('abl-detail-page.html');    
    }
}


function getAvailability(record, imgurl) {
    myApp.showIndicator();
    var ablavailurl = "http://localhost/proxyvoorbibapp.php?url=http://zoeken." + voorkeurbib + ".bibliotheek.be/api/v0/availability/?id=" + record;
    var imgsrc = imgurl;   
    var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState==4 && xmlhttp.status==200){
                    toonDetailscherm(xmlhttp, imgsrc);
                    myApp.hideIndicator();
                    }
                };
        xmlhttp.open("GET", ablavailurl, true);
        xmlhttp.send();
}

function naarMBview(selector) {
    var iframesrc = $$(selector).data('holdlink');
    $$('#view-3 iframe').attr('src', iframesrc);
    myApp.showTab('#view-3');
}


// searchbar zou ideaal zijn voor als er autocomplete is in api; nu louter illustratief

//var mySearchbar = myApp.searchbar('.searchbar', {
//    customSearch: true,
//    onSearch: function (query) {
//        myApp.showIndicator();
//        var ablsearch = "http://localhost:800/proxyvoorbibapp.php?url=http://zoeken." + voorkeurbib + ".bibliotheek.be/api/v0/search/?q=" + query;
//        var xmlhttp = new XMLHttpRequest();
//        xmlhttp.onreadystatechange = function() {
//            if (xmlhttp.readyState==4 && xmlhttp.status==200){
//                    toonZoekResultaten(xmlhttp);
//                    console.log(query);
//                    myApp.hideIndicator();}
//                };
//        //xmlhttp.open("GET", ablsearch, true); // deze later gebruiken als autocomplete api er is, + dan ook ablsearch variabele bewerken
//        xmlhttp.open("GET", "http://localhost:800/proxyvoorbibapp.php?url=http://mijn.bibliotheek.be/list/api/1831", true);
//        xmlhttp.send();
//        },
//    onDisable: function() {
//        $$("#doeldiv").html("<ul></ul>");
//    }
//});  

function searchabl(pagina){
    myApp.showIndicator();
    var zoekterm = document.querySelector('input[name=ablzoekvak]').value;
    // spaties vertalen
    zoekterm = zoekterm.split(' ').join('%20');
    // zoekresultatenlijst leeg maken bij een nieuwe zoekopdracht
    if ( vorigezoekterm !== zoekterm ){ 
        $$("#doeldiv").html("");
    }
    vorigezoekterm = zoekterm;

    // zoekopdracht loopt via proxy omwille van cross domain access restricties
    var ablsearch = "http://localhost/proxyvoorbibapp.php?url=http://zoeken." + voorkeurbib + ".bibliotheek.be/api/v0/search/?q=&zoekstring=" + zoekterm + "&pagina=" + pagina;
    var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState==4 && xmlhttp.status==200){
                    toonZoekResultaten(xmlhttp);
                    myApp.hideIndicator();
                    }
                };
        xmlhttp.open("GET", ablsearch, true);
        xmlhttp.send();
}

function ToonAanwinsten(pagina) {
    myApp.showIndicator();
    
    var materiaalsoort = document.querySelector('input[name=radio_material]:checked').value;
        switch (materiaalsoort){
            case "fictie": 
                materiaalsoort = "format:boek%20AND%20type:fictie%20AND%20";
                break;
            case "non-fictie":
                materiaalsoort = "format:boek%20AND%20type:non-fictie%20AND%20";
                break;
            case "strips":
                materiaalsoort = "format:strip%20AND%20";
                break;
            case "muziek":
                materiaalsoort = "type:muziek%20NOT%20format:track%20AND%20";
                break;
            case "dvd-video":
                materiaalsoort = "type:film%20AND%20";
                break;
            default:
                materiaalsoort = "NOT%20format:track%20NOT%20format:%27artikel%20uit%20tijdschrift%27%20NOT%20format:tijdschrift%20AND%20";
        }
    
    var leeftijd = document.querySelector('input[name=radio_age]:checked').value;
        switch (leeftijd){
            case "all":
                leeftijd = "";
                break;
            case "volwassenen":
                leeftijd = "doelgroep:volwassenen%20";
                break;
            case "jeugd":
                leeftijd = "doelgroep:jeugd%20";
                break;
            default:
                leeftijd = "";
        }
    
    var periode = document.querySelector('input[name=radio_periode]:checked').value;
    
    var zoekstring = "http://localhost/proxyvoorbibapp.php?url=http://zoeken." + voorkeurbib + ".bibliotheek.be/api/v0/search/?q=&zoekstring=" + materiaalsoort + leeftijd + "AND%20dateacquired:now-" + periode + "&pagina=" + pagina;
      
    var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState==4 && xmlhttp.status==200){
                    toonZoekResultaten(xmlhttp);
                    myApp.hideIndicator();}
                };
        xmlhttp.open("GET", zoekstring, true);
        xmlhttp.send();
}


// doeldiv met aquabrowser resultaten leeg maken bij klik op andere tab
$$("#view-2 .tab-link").on('click', function (e){
    $$("#doeldiv").html("<ul></ul>");
    $$('#filter').removeClass('toonfilter');
    $$('#filter').addClass('hidden');
});