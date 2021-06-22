const express = require("express");
const {
  getProdutos,
  getCarrinho,
  inserirProdutoNoCarrinho,
  editarQuantidade,
} = require("./controladores/funcoes");

const roteador = express();

roteador.get("/produtos", getProdutos);
roteador.get("/carrinho", getCarrinho);
roteador.post("/carrinho/produtos", inserirProdutoNoCarrinho);
roteador.patch("/carrinho/produtos/:idProduto", editarQuantidade);

module.exports = roteador;
