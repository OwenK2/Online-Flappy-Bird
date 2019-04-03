<?php
  $newScore = (int)$_POST['score'];
  file_put_contents('highScore.txt', $newScore);
?>