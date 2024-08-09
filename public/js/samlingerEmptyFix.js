const x = document.querySelectorAll('h1');


x.forEach(x => {
    if(x.innerText === "") {
        x.parentElement.style.display = 'none';
    }
});