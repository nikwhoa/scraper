let a = [{ title: 'a' }, { title: 'b' }, { title: 'c' }, { title: 'd' }];
let b = [{ title: 'd' }, { title: 'e' }, { title: 'a' }];
let c = [];



// a.map(el => console.log(el.title))

b.filter((item) => {
    // console.log(item.title);
    if (!a.map(el => el.title).includes(item.title)) {
        a.push(item);
    }
    // else {
    //     console.log('duplicate');
    // }
})


console.log(a);