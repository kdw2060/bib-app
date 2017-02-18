<?php

header("Access-Control-Allow-Origin: *");
    
if (isset ($_GET["url"])) {
    
    $url = $_GET["url"];
        
        if ( strpos($url, "zoeken.") !== false && strpos($url, "availability") == false ) { 
            $zoekstring = $_GET["zoekstring"];
            $pagina = $_GET["pagina"];
            $zoekurl = $url . urlencode($zoekstring);
            //$zoekurl = 'http://zoeken.buggenhout.bibliotheek.be/api/v0/search/?q=' . urlencode($zoekstring);
            $zoekurl .= '&page=' . $pagina . '&ps=10&authorization=034b35a52c528529941bca5f657eb214';
            //$zoekurl .= '&page=' . $pagina . '&ps=10&authorization=f2c359618130a698cca2e6b2736ab9fc';
            file_put_contents('kopiezoekurl.txt', $zoekurl);
            $xml = file_get_contents("$zoekurl");
            file_put_contents('local_copy_search_results.xml', $xml);
            echo $xml;
        }
        
        if ( strpos($url, "availability") !== false ) { 
            $zoekstring = $_GET["zoekstring"];            
            $zoekurl = $url . urlencode($zoekstring);
            //$zoekurl = 'http://zoeken.buggenhout.bibliotheek.be/api/v0/availability/?id=' . urlencode($zoekstring);
            $zoekurl .= '&authorization=034b35a52c528529941bca5f657eb214';
            //$zoekurl .= '&authorization=10&f2c359618130a698cca2e6b2736ab9fc';
            $xml = file_get_contents("$zoekurl");
            file_put_contents('local_copy_availdata.xml', $xml);
            echo $xml;
        }
    
        else {
        $xml = file_get_contents("$url");
        echo $xml; }
}
?>
