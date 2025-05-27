<!DOCTYPE html>
<html>
<head>
  <title>Recent Projects</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f7f7f7;
      text-align: center;
    }
    .grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      padding: 20px;
    }
    img {
      width: 250px;
      height: auto;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <h1>Recent Projects</h1>
  <div class="grid">
    <% images.forEach(url => { %>
      <img src="<%= url %>=w600-h400" alt="Project Photo">
    <% }) %>
  </div>
</body>
</html>