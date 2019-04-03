<html>
<head>
  <title>Flappy</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" href="res/favicon.png" />
  <script src="index.js"></script>
</head>
<body onload="load()" onresize="resize()">
  <script>
    var highScore;
    function newHighScore() {
      highScore = JSON.parse(<?php echo json_encode(file_get_contents('highScore.txt')); ?>);
    }
    newHighScore();
  </script>
  <canvas id="canvas"></canvas>
</body>
</html>