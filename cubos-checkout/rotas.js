const express = require("express");
const {
  getProdutos,
  getCarrinho,
  inserirProdutoNoCarrinho,
  editarQuantidade,
  deletarProduto,
  deletarCarrinho,
  finalizarCompra,
} = require("./controladores/funcoes");

const roteador = express();

roteador.get("/produtos", getProdutos);
roteador.get("/carrinho", getCarrinho);
roteador.post("/carrinho/produtos", inserirProdutoNoCarrinho);
roteador.patch("/carrinho/produtos/:idProduto", editarQuantidade);
roteador.delete("/carrinho/produtos/:idProduto", deletarProduto);
roteador.delete("/carrinho", deletarCarrinho);
roteador.post("/carrinho/finalizar-compra", finalizarCompra);

module.exports = roteador;
