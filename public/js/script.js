var footer = document.getElementById("foot");




// Close footer button:
function closeFoot() {

    footerClosed = sessionStorage.setItem('footerClosed', 'none')
    footer.style.display = sessionStorage.getItem('footerClosed');
    console.log(sessionStorage.getItem('footerClosed'));
}

// Check if button already pressed:
if(sessionStorage.getItem('footerClosed') === "none") {
    footer.style.display = "none";
}




