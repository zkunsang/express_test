Object.defineProperties(Number.prototype, {
    $padStart : {
        enumerable: false,
        value: function (length, pad) {
            return this.toString().padStart(length, pad);
        }
    },
});