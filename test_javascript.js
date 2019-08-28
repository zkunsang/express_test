var temp_object = {};


temp_object.temp = function(args) {
    console.log(this);
}

temp_object.temp();

var human = {};
human.name = "human";


temp_object.temp.call(human);