casper.test.on("exit", function() {
  console.log("exited");
})

casper.test.begin("sample", function(test) {
  test.assert(true);
  test.done();
});
