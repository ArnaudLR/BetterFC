// ==UserScript==
// @name		Better FC
// @namespace	http://meurgues.fr/greasemonkey
// @description	version 0.6.1 - Améliore l'ergonomie du Forum Catholique
// @include		http://leforumcatholique.org/forum.php*
// @include		http://www.leforumcatholique.org/forum.php*
// @resource	icon_folded			http://meurgues.fr/images/icon_folded.png
// @resource	icon_unfolded		http://meurgues.fr/images/icon_unfolded.png
// @resource	icon_dropdown		http://meurgues.fr/images/icon_drop_down.gif
// @resource	icon_dropdown_up	http://meurgues.fr/images/icon_drop_down_up.gif
// @resource	icon_close			http://meurgues.fr/images/icon_close_toast.gif
// @resource	icon_response		http://meurgues.fr/images/reponse.gif
// ==/UserScript==

// 0.6.1 - conservation du nombre de lisure (title du lien)
// 0.6.0 - intégration de JQuery

function include(fileName) {
	if (document.getElementsByTagName) {
		Script = document.createElement("script");
		Script.type = "text/javascript";
		Script.src = fileName;
		Body = document.getElementsByTagName("BODY");
		if (Body) {
			Body[0].appendChild(Script);
		}
	}
}

document.defaultColor = "#6699cc"
var allTextareas, thisTextarea;

function indentLevel(spaces) {
  level = 0;
  if (spaces > 1) {
    level = (spaces-2)/4; 
  }
  return level+1;
}

function requestPage(src, func) {
    var xhr = new window.XMLHttpRequest();
    xhr.onreadystatechange = function() { func(xhr); };
    xhr.open("GET", src);
    // this fixes the content type glitch...
    xhr.overrideMimeType("text/html; charset=ISO-8859-1");
    xhr.send(null);
}

function Fold(msgid) {
  a = document.getElementById("msgid");
  if (a) {
    img = a.nextSibling.nextSibling.nextSibling;
    if (img) {
      img.src = 'http://meurgues.fr/images/icon_folded.png';
      img.nextSibling.style.display = 'none';
      GM_setValue(msgid,"folded");
    }
  }
}

function ConfigWindow() {
  this.toggle = ConfigWindow_toggle
  
  this.main     = document.createElement('div')
    this.main.style.position = 'fixed'
    this.main.style.top  = 0
    this.main.style.left = 0
    this.main.style.background = 'white'
    this.main.style.zIndex = 9999
    //this.main.style.border = "black solid 1px"
  
    this.titlebar = document.createElement('div')
      this.main.appendChild(this.titlebar)
      this.titlebar.style.border = "black solid 1px"
      
      open = document.createElement('img')
        this.titlebar.appendChild(open)
        open.src = GM_getValue("config") ? 'http://meurgues.fr/images/icon_drop_down.gif' : 'http://meurgues.fr/images/icon_drop_down_up.gif'
        open.addEventListener('click',
                              function (e) {
                                document.configWindow.toggle()
                              },
                              false);
      title = document.createElement('span')
        this.titlebar.appendChild(title)
        title.textContent = " Fenêtre de Configuration"

    this.content  = document.createElement('div')
      this.main.appendChild(this.content)
      this.content.style.display = GM_getValue("config") ? 'block' : 'none'
  
      opacity = document.createElement('div')
        box = document.createElement('input')
          opacity.appendChild(box)
          box.type = 'checkbox'
          box.name = 'opacity'
          box.id   = 'opacitybox'
          box.checked = GM_getValue("opacity")
          box.addEventListener('click',
                               function (e) {
                                 box = e.currentTarget
                                 
                                 opacity = box.checked ? 0.3 : 1
                                 GM_setValue("opacity",box.checked)
                                 allTextareas = Array.filter(document.getElementsByTagName('div'),
                                                             function(elem) {
                                                               return elem.className == 'translucency';
                                                             }
                                                            )
                                 for (var i = 0; i < allTextareas.length; i++) {
                                     allTextareas[i].style.opacity = opacity
                                 }
                               },
                               false)

        legend = document.createElement('span')
          opacity.appendChild(legend)
          legend.textContent = 'Transparence'
        this.content.appendChild(opacity)
        
      background = document.createElement('div')
        box = document.createElement('input')
          background.appendChild(box)
          box.type = 'checkbox'
          box.name = 'background'
          box.id   = 'backgroundbox'
          box.addEventListener('click',
                               function (e) {
                                 box = e.currentTarget
                                 
                                 GM_setValue("background",box.checked)
                                 body = document.getElementsByTagName('BODY')[0];
                                 if (box.checked) {
                                   body.style.background = document.defaultColor
                                 } else {
                                   body.style.background = null
                                 }
                               },
                               false);
        legend = document.createElement('span')
          background.appendChild(legend)
          legend.textContent = 'fond'
        this.content.appendChild(background)
  
  body = document.getElementsByTagName('BODY')[0];
  body.insertBefore(this.main,body.firstChild);
  
  document.configWindow = this
}

function ConfigWindow_toggle() {
  if (this.content.style.display != 'none') {
    this.content.style.display = 'none'
    this.titlebar.firstChild.src = 'http://meurgues.fr/images/icon_drop_down.gif'
    GM_setValue("config",false)
  } else {
    this.content.style.display = 'block'
    this.titlebar.firstChild.src = 'http://meurgues.fr/images/icon_drop_down_up.gif'
    GM_setValue("config",true)
  }
}

function PreviewWindow(title) {
  this.setTitle       = PreviewWindow_setTitle
  this.setHTMLContent = PreviewWindow_setHTMLContent
  this.setDOMContent  = PreviewWindow_setDOMContent
  this.setVisible     = PreviewWindow_setVisible
  this.setID          = PreviewWindow_setID
  
  this.menu    = document.createElement('div')
  closebutton = document.createElement('img')
  closebutton.src = 'http://meurgues.fr/images/icon_close_toast.gif'
  closebutton.addEventListener('click',
                                function (e) {
                                  document.previewWindow.setVisible(false)
                                },
                                false);
  this.menu.appendChild(closebutton)
  this.title = document.createElement('span')
  this.title.textContent = title
  this.title.id = 'previewTitle'
  this.menu.appendChild(this.title)
  this.answer = document.createElement('form')
  this.answer.style.display = 'inline'
  this.answer.method = 'post'
  this.answer.action = 'reponseN.php'
  button = document.createElement('input')
  button.value = 'submit'
  button.type = 'image'
  button.src = 'http://meurgues.fr/images/reponse.gif'
  this.answer.appendChild(button)
  hidden = document.createElement('input')
  hidden.type = 'hidden'
  hidden.value = 0
  hidden.name = 'num'
  this.answer.appendChild(hidden) 
  this.menu.appendChild(this.answer)
    
  this.content = document.createElement('div')
  this.content.style.overflowY = 'scroll';
  this.content.style.height = 300-15;

  this.main       = document.createElement('div')
  this.main.appendChild(this.menu)
  this.main.appendChild(this.content)

  this.main.id = "preview"
  this.main.style.position = 'fixed'
  this.main.style.zIndex = 9999;
  this.main.style.height = 300;
  this.main.style.left = 0;
  this.main.style.visibility = 'hidden';
  this.main.style.background = 'lightgrey'  

  document.previewWindow = this

  // add preview element to the body
  body = document.getElementsByTagName('BODY')[0];
  body.appendChild(this.main);
}

function PreviewWindow_setTitle(titre) {
  this.title.textContent = titre
}

function PreviewWindow_setHTMLContent(content) {
  this.content.innerHTML = content
}

function PreviewWindow_setDOMContent(content) {
  while (this.content.firstChild) this.content.removeChild(this.content.firstChild)
  this.content.appendChild(content)
}

function PreviewWindow_setVisible(visible) {
  if (visible) {
    window = document.defaultView
    this.main.style.top = window.innerHeight - 300
    this.main.style.width = window.innerWidth;

    this.main.style.visibility = 'visible';
		$(this.main).slideDown();
  } else {
    this.main.style.visibility = 'hidden'
	}
}

function PreviewWindow_setID(id) {
  this.answer.lastChild.value = id
}

function Color(diff) {
  colors = [ '#000000','#663300','#996600', '#ff6600','#ff0000']

  diff = diff/(60*60); // diff in hours
  if (diff < 2) // < 2h
    datecolor = 4;
  else if (diff < 24) // < 24h
    datecolor = 3
  else if (diff < 48) // < 48h
    datecolor = 2
  else if (diff < (24*7)) // < 7j
    datecolor = 1
  else
    datecolor = 0;

  return colors[datecolor]
}

var msgnb = 0;

function ReWrite(par) {
  var child = par.firstChild;
  var alerttext = "";
  done = false;
  text = "";
  
  currentIndent = 0;
  currentIndentSpaces = 0;
  
  while (!done) {
    var nodes = [];
    var i=0;
    
    while (child && child.tagName != "BR") {
      nodes[i++]=child;
      child = child.nextSibling;
    }
    
    if (child) {
    	child = child.nextSibling;
  	indentSpaces = nodes[0].length;
  	if (indentSpaces > currentIndentSpaces) { // increases indentation
  	  if (GM_getValue(msgnb)=='folded') {
  	    if (currentIndent>0)
  	      text += "<img class='folding' src='http://meurgues.fr/images/icon_folded.png' />";
  	    text += "<ul style='list-style-type: none; margin-left: 0mm; padding-left: 1em; display: none'>\n<li>";	  
  	  } else {
  	    if (currentIndent>0)
  	      text += "<img class='folding' src='http://meurgues.fr/images/icon_unfolded.png' />";
  	    text += "<ul style='list-style-type: none; margin-left: 0mm; padding-left: 1em;'>\n<li>";	  
  	  }
  	  currentIndent++;
  	} else if (indentSpaces < currentIndentSpaces) { // decreases indentation
  	  while (currentIndent > indentLevel(indentSpaces)) {
  	  	text += "</li>\n</ul>\n"; 	  	
  	  	currentIndent--;
  	  }
  	  text += "<li>"
  	} else { // same indentation
  	  text += "</li>\n<li>";

  	}
  	currentIndentSpaces = indentSpaces;

  	// look for date,
  	var diff = -1;
  	op = nodes[4].nodeValue.lastIndexOf('(');
  	cp = nodes[4].nodeValue.lastIndexOf(')');
  	if (op!=cp) {
  	  timetext = nodes[4].nodeValue.slice(op+1,cp);
  	  cp = timetext.lastIndexOf(' ');
  	
	  datetext = timetext.slice(0,cp);
	  hourtext = timetext.slice(cp+1);
 
  	  sep = datetext.lastIndexOf('-');
  	  dayvalue = datetext.slice(sep+1);
  	  while (dayvalue[0]=='0') dayvalue = dayvalue.substring(1);
  	  day = parseInt(dayvalue);
  	  
  	  datetext = datetext.slice(0,sep);
  	  sep = datetext.lastIndexOf('-');
  	  monthvalue = datetext.slice(sep+1);
  	  while (monthvalue[0]=='0') monthvalue = monthvalue.substring(1);
  	  month = parseInt(monthvalue);
  	  
  	  datetext = datetext.slice(0,sep);
  	  year = parseInt(datetext);
  	   	  
  	  sep = hourtext.lastIndexOf(":");
  	  secvalue = hourtext.slice(sep+1);
  	  while (secvalue[0]=='0') secvalue = secvalue.substring(1); if (secvalue.length==0) secvalue="0";
  	  sec = parseInt(secvalue);
  	  
  	  hourtext = hourtext.slice(0,sep);
  	  sep = hourtext.lastIndexOf(':');
  	  minvalue = hourtext.slice(sep+1);
  	  while (minvalue[0]=='0') minvalue = minvalue.substring(1); if (minvalue.length==0) minvalue="0";
  	  min = parseInt(minvalue);
  	  
  	  hourtext = hourtext.slice(0,sep);
  	  while (hourtext[0]=='0') hourtext = hourtext.substring(1); if (hourtext.length==0) hourtext="0";
  	  hour = parseInt(hourtext);
  	   	  
  	  msgdate = new Date();
  	  msgdate.setFullYear(year);
  	  msgdate.setMonth(month-1);
  	  msgdate.setDate(day);
  	  msgdate.setHours(hour);
  	  msgdate.setMinutes(min);
  	  msgdate.setSeconds(sec);
  	  
  	  // compute the color according to the difference with the current date
  	  now = new Date();
  	  diff = (now.getTime() - msgdate.getTime())/1000; // diff in seconds
  	}
	
	msgnb = nodes[3].href.slice(nodes[3].href.lastIndexOf('=')+1);
  	text +=  "<img class='humeur' src='" + nodes[1].src + "' /><a class='msg' id='" + msgnb + "' href=" + nodes[3].href + ' title="' + nodes[3].title + '" > ' + nodes[3].innerHTML + "</a>" + "<span style='color: " + Color(diff) + "'>" + nodes[4].nodeValue + "</span>";
	text += "<form style='display: inline' method='post' action='reponseN.php'>" +
	        "<input border='0' src='http://meurgues.fr/images/reponse.gif' type='image' class='login' value='submit' />"+
	        "<input type='hidden' value='" + msgnb + "' name='num'>" +
	        "</form>"
    } else 
    	done = true;
  }

  // close all the unclosed indentations, if remaining
  while (currentIndent > 0) {
    text += "</li>\n</ul>\n";
    currentIndent--;
  }

  // replace the paragraph by the new computed one
  newPar = document.createElement('p');
  newPar.className = 'msg';
  newPar.style.border = "black solid 1px";
  newPar.style.position = 'relative';
  newPar.style.width = "60em";
  newPar.style.zIndex = 0;
  //newPar.style.overflow = 'hidden';
  
  divtext = document.createElement('div');
  divtext.innerHTML= text; 
  divtext.style.position = 'relative';
  
  divbkg = document.createElement('div');
  divbkg.style.position = 'absolute';
  divbkg.style.top = 0;
  divbkg.style.left = 0;
  divbkg.style.right = 0;
  divbkg.style.bottom = 0;
  divbkg.className = 'translucency'
  //divbkg.style.zIndex = -1;
  divbkg.style.background = 'white';
  if (GM_getValue("opacity")) divbkg.style.opacity = 0.3;

  newPar.appendChild(divbkg);
  newPar.appendChild(divtext);
  
  par.parentNode.replaceChild(newPar,par);
  
}

function Init() {

	if (GM_getValue("background")) {
	  body = document.getElementsByTagName('BODY')[0]
	  body.style.background = document.defaultColor;
	}

	allTextareas = document.getElementsByTagName('P');
	for (var i = 0; i < allTextareas.length; i++) {
	    thisTextarea = allTextareas[i];
	    ReWrite(thisTextarea);
	}

	allTextareas = Array.filter( document.getElementsByTagName('img'), function(elem){
	   return elem.className == 'folding';
	 });
	for (var i = 0; i < allTextareas.length; i++) {
	    thisTextarea = allTextareas[i];
	    thisTextarea.addEventListener('click',
	                                  function (e) {
	                                    img=e.currentTarget;
	                                    a = img.previousSibling.previousSibling.previousSibling;
	                                    msgid = a.id;
	                                    if (img.nextSibling.style.display!='none') {
	                                      img.src = 'http://meurgues.fr/images/icon_folded.png';
																				$(img.nextSibling).slideToggle();
	                                      GM_setValue(msgid,'folded');
	                                    } else {
	                                      img.src = 'http://meurgues.fr/images/icon_unfolded.png';
																				$(img.nextSibling).slideToggle();
	                                      GM_setValue(msgid,'unfolded');
	                                    }
	                                  },
	                                  false);
	}

	allTextareas = Array.filter(document.getElementsByTagName('img'),
	                            function(elem) { return elem.className == 'humeur';}
	                           );
	for (var i = 0; i < allTextareas.length; i++) {
	    thisTextarea = allTextareas[i];
	    
	    thisTextarea.addEventListener('click',
	                                  function (e) {
	                                    a=e.currentTarget.nextSibling;
	                                    
	                                    document.previewWindow.setTitle(a.text)
	                                    document.previewWindow.setVisible(true)
	                                    document.previewWindow.setHTMLContent("<em>loading message...</em>")
	                                    document.previewWindow.setID(a.id)
	                                    
	                                    requestPage(a.href,
	                                                function (xhr) {
	                                                  if (xhr.readyState == 4) {
	                                                    text = xhr.responseText;

	                                                    preparepreview = document.createElement('div')
	                                                    preparepreview.innerHTML = text;
	                                                    tables = Array.filter(preparepreview.getElementsByTagName('table'),
	                                                                          function(elem){ 
	                                                                            return elem.className == 'dispmsg';
	                                                                          }
	                                                                         );
	                                                    table = tables[0];
	                                                    table = table.lastChild.lastChild.previousSibling.firstChild.firstChild.nextSibling
	                                                    
	                                                    document.previewWindow.setDOMContent(table)
	                                                  }
	                                                }
	                                               );
	                                  },
	                                  false);
	}

	previewwindow = new PreviewWindow("empty")
	configwindow = new ConfigWindow()

	body.style.backgroundAttachment = 'fixed';
	// fleur de lys centrale en fond
	/*
	body.style.backgroundImage = "url(http://www.temple-of-flora.com/images/500/fleur-de-lys_500.jpg)";
	body.style.backgroundPosition = 'center';
	body.style.backgroundRepeat = 'no-repeat';
	*/
}

// Add jQuery
var GM_JQ = document.createElement('script');
GM_JQ.src = 'http://jquery.com/src/jquery-latest.js';
GM_JQ.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(GM_JQ);

// Check if jQuery's loaded
function GM_wait() {
	if(typeof unsafeWindow.jQuery == 'undefined') { window.setTimeout(GM_wait,100); }
	else { $ = unsafeWindow.jQuery; letsJQuery(); }
}
GM_wait();

// All your GM code must be inside this function
function letsJQuery() {
	Init();
}
