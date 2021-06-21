const express = require("express");
const {
  getProdutos,
  getCarrinho,
  inserirProdutoNoCarrinho,
} = require("./controladores/funcoes");

const roteador = express();

roteador.get("/produtos", getProdutos);
roteador.get("/carrinho", getCarrinho);
roteador.post("/carrinho/produtos", inserirProdutoNoCarrinho);

module.exports = roteador;
