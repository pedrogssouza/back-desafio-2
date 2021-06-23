const { lerArquivo, escreverNoArquivo } = require("../bibliotecaFS");
const { addBusinessDays } = require("date-fns");

async function getProdutos(req, res) {
  const categoria = req.query.categoria;
  const precoInicial = Number(req.query.precoInicial);
  const precoFinal = Number(req.query.precoFinal);
  const { produtos } = await lerArquivo();
  const produtosFiltrados = produtos
    .filter((produto) => produto.estoque)
    .filter((produto) => {
      if (!(categoria || precoInicial || precoFinal)) {
        return produto;
      }
      if (categoria) {
        if (precoInicial && precoFinal) {
          if (
            precoInicial <= produto.preco &&
            produto.preco <= precoFinal &&
            categoria === produto.categoria
          ) {
            return produto;
          }
        } else if (precoInicial) {
          if (
            precoInicial <= produto.preco &&
            categoria === produto.categoria
          ) {
            return produto;
          }
        } else if (precoFinal) {
          if (produto.preco <= precoFinal && categoria === produto.categoria) {
            return produto;
          }
        } else if (categoria === produto.categoria) {
          return produto;
        }
      } else {
        if (precoInicial && precoFinal) {
          if (precoInicial <= produto.preco && produto.preco <= precoFinal) {
            return produto;
          }
        } else if (precoInicial) {
          if (precoInicial <= produto.preco) {
            return produto;
          }
        } else if (precoFinal) {
          if (produto.preco <= precoFinal) {
            return produto;
          }
        }
      }
    });
  res.json(produtosFiltrados);
}

async function getCarrinho(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();
  const produtosDoCarrinho = carrinho.produtos;
  const data = new Date();
  const dataDeEntrega = addBusinessDays(data, 15);

  let subTotal = 0;
  for (const produto of produtosDoCarrinho) {
    subTotal += produto.preco * produto.quantidade;
  }

  const total = subTotal ? subTotal : 0;

  const valorDoFrete = subTotal > 20000 ? 0 : 5000;
  const frete = subTotal ? valorDoFrete : 0;

  const carrinhoFormatado = {
    produtos: produtosDoCarrinho,
    subTotal: total,
    dataDeEntrega: subTotal ? dataDeEntrega : null,
    valorDoFrete: frete,
    totalAPagar: total + frete,
  };

  await escreverNoArquivo({
    produtos: produtosEmEstoque,
    carrinho: carrinhoFormatado,
  });

  res.json(carrinhoFormatado);
}

async function inserirProdutoNoCarrinho(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();

  const id = Number(req.body.id);
  const quantidade = Number(req.body.quantidade);

  const produto = produtosEmEstoque.find((produto) => produto.id === id);

  const indiceProdutoEmEstoque = produtosEmEstoque.findIndex(
    (produtoEmEstoque) => produtoEmEstoque.id === id
  );

  const indiceProdutoDoCarrinho = carrinho.produtos.findIndex(
    (produtoDoCarrinho) => produtoDoCarrinho.id === id
  );

  if (produto) {
    if (produto.estoque >= quantidade) {
      if (indiceProdutoDoCarrinho !== -1) {
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade += quantidade;
      } else {
        const produtoFormatado = {
          id: produto.id,
          quantidade: quantidade,
          nome: produto.nome,
          preco: produto.preco,
          categoria: produto.categoria,
        };
        carrinho.produtos.push(produtoFormatado);
      }

      produtosEmEstoque[indiceProdutoEmEstoque].estoque -= quantidade;

      await escreverNoArquivo({
        produtos: produtosEmEstoque,
        carrinho: carrinho,
      });
      return getCarrinho(req, res);
    } else {
      res.json(`O estoque não contém a quantidade desejada de ${produto.nome}`);
      return;
    }
  } else {
    res.json("O ID informado não é válido");
    return;
  }
}

async function editarQuantidade(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();

  const quantidade = Number(req.body.quantidade);
  const id = Number(req.params.idProduto);
  const indiceProdutoDoCarrinho = carrinho.produtos.findIndex(
    (produtoDoCarrinho) => produtoDoCarrinho.id === id
  );

  const indiceProdutoEmEstoque = produtosEmEstoque.findIndex(
    (produtoEmEstoque) => produtoEmEstoque.id === id
  );

  if (indiceProdutoDoCarrinho !== -1) {
    if (quantidade > 0) {
      if (produtosEmEstoque[indiceProdutoEmEstoque].estoque >= quantidade) {
        produtosEmEstoque[indiceProdutoEmEstoque].estoque -= quantidade;
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade += quantidade;
      } else {
        res.json("O estoque não contém a quantidade desejada de", produto.nome);
        return;
      }
    } else {
      if (
        -1 * quantidade >
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade
      ) {
        res.json(
          `O carrinho não possui ${-1 * quantidade} de ${
            carrinho.produtos[indiceProdutoDoCarrinho].nome
          } para remover`
        );
        return;
      } else {
        produtosEmEstoque[indiceProdutoEmEstoque].estoque -= quantidade;
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade += quantidade;

        if (carrinho.produtos[indiceProdutoDoCarrinho].quantidade === 0) {
          carrinho.produtos.splice(indiceProdutoDoCarrinho, 1);
        }
      }
    }
  } else {
    res.json("O produto informado ainda não foi adicionado ao carrinho");
    return;
  }

  await escreverNoArquivo({
    produtos: produtosEmEstoque,
    carrinho: carrinho,
  });

  return getCarrinho(req, res);
}

async function deletarProduto(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();
  const id = Number(req.params.idProduto);

  const indiceProdutoDoCarrinho = carrinho.produtos.findIndex(
    (produtoDoCarrinho) => produtoDoCarrinho.id === id
  );

  if (indiceProdutoDoCarrinho !== -1) {
    const produtosRemovidos = carrinho.produtos.splice(
      indiceProdutoDoCarrinho,
      1
    );

    const indiceProdutoEmEstoque = produtosEmEstoque.findIndex(
      (produtoEmEstoque) => produtoEmEstoque.id === id
    );

    produtosEmEstoque[indiceProdutoEmEstoque].estoque +=
      produtosRemovidos[0].quantidade;

    await escreverNoArquivo({
      produtos: produtosEmEstoque,
      carrinho: carrinho,
    });

    return getCarrinho(req, res);
  } else {
    res.json(
      "O produto informado não foi adicionado ao carrinho, portanto não pode ser removido do carrinho"
    );
  }
}

async function deletarCarrinho(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();

  for (let produto of carrinho.produtos) {
    const id = produto.id;

    const indiceProdutoEmEstoque = produtosEmEstoque.findIndex(
      (produtoEmEstoque) => produtoEmEstoque.id === id
    );

    produtosEmEstoque[indiceProdutoEmEstoque].estoque += produto.quantidade;
  }

  await escreverNoArquivo({
    produtos: produtosEmEstoque,
    carrinho: {
      produtos: [],
      subtotal: 0,
      dataDeEntrega: null,
      valorDoFrete: 0,
      totalAPagar: 0,
    },
  });

  res.json("O carrinho foi esvazeado com sucesso!");
}

async function finalizarCompra(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();

  if (carrinho.produtos.length === 0) {
    res.json("O carrinho está vazio");
    return;
  }

  if (req.body.type !== undefined) {
    if (req.body.type !== "individual") {
      res.json("O type precisa ser 'individual'");
      return;
    }
  } else {
    res.json("O type não foi informado no body");
    return;
  }

  if (req.body.country !== undefined) {
    if (req.body.country.length !== 2) {
      res.json("Informe a sigla do país com apenas 2 caracteres");
      return;
    }
  } else {
    res.json("O país não foi informado no body");
    return;
  }

  if (req.body.name !== undefined) {
    if (!req.body.name.includes(" ")) {
      res.json("É necessário passar o nome e o sobrenome no campo 'name'");
      return;
    }
  } else {
    res.json("O nome não foi informado no body");
    return;
  }

  if (req.body.documents !== undefined) {
  } else {
    res.json("É necessário passar os documents");
    return;
  }
}

module.exports = {
  getProdutos,
  getCarrinho,
  inserirProdutoNoCarrinho,
  editarQuantidade,
  deletarProduto,
  deletarCarrinho,
  finalizarCompra,
};
