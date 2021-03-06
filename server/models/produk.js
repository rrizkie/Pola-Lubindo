"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Produk extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Produk.belongsTo(models.Brand);
      Produk.belongsToMany(models.User, { through: models.Cart });
      Produk.hasMany(models.Cart);
    }
  }
  Produk.init(
    {
      namaProduk: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      deskripsi: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      minPesanan: DataTypes.INTEGER,
      fotoProduk: DataTypes.STRING,
      videoProduk: DataTypes.STRING,
      stock: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
        },
      },
      statusProduk: DataTypes.BOOLEAN,
      sku: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      discount: DataTypes.INTEGER,
      weight: DataTypes.INTEGER,
      panjang: DataTypes.INTEGER,
      lebar: DataTypes.INTEGER,
      tinggi: DataTypes.INTEGER,
      komisi: DataTypes.INTEGER,
      komisiStatus: DataTypes.BOOLEAN,
      hargaSatuan: DataTypes.INTEGER,
      hargaGrosir: DataTypes.INTEGER,
      levelKomisi: DataTypes.INTEGER,
      brandId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Produk",
    }
  );

  Produk.beforeCreate((produk, option) => {
    produk.komisi = 10;
  });
  return Produk;
};
