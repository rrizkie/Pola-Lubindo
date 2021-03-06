const {
  Transaksi,
  Cart,
  Produk,
  User,
  Komisi,
  TransaksiKomisi,
} = require("../models");
const { Op } = require("sequelize");
const cronJob = require("cron").CronJob;

class Controller {
  static getTransaksiBeforePayment = async (req, res) => {
    try {
      const allTransaksi = await Transaksi.findAll({
        where: { statusPembayaran: "menunggu pembayaran" },
        include: {
          where: { userId: req.user.id },
          model: Cart,
          include: Produk,
        },
      });
      return res.status(200).json(allTransaksi);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error);
    }
  };

  static getTransaksiAfterPayment = async (req, res) => {
    try {
      const allTransaksi = await Transaksi.findAll({
        where: {
          statusPengiriman: {
            [Op.or]: [
              "menunggu konfirmasi",
              "siap di kirim",
              "dalam pengiriman",
              "selesai",
              "pesanan di tolak",
              "pesanan selesai",
            ],
          },
          statusPesanan: {
            [Op.or]: [
              "menunggu konfirmasi",
              "pesanan di konfirmasi",
              "pesanan di tolak",
              "pesanan selesai",
            ],
          },
        },
        include: {
          where: { userId: req.user.id },
          model: Cart,
          include: Produk,
        },
      });
      return res.status(200).json(allTransaksi);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error);
    }
  };

  static editTransaksi = async (req, res) => {
    try {
      const {
        invoice,
        totalHarga,
        ongkosKirim,
        statusPesanan,
        statusPembayaran,
        statusPengiriman,
        metodePembayaran,
        namaRekening,
        jumlahBayar,
        bankAsal,
        bankTujuan,
        namaPenerima,
        alamatPengiriman,
      } = req.body;
      const edited = await Transaksi.update(
        {
          invoice,
          totalHarga,
          ongkosKirim,
          statusPesanan,
          statusPembayaran,
          statusPengiriman,
          metodePembayaran,
          namaRekening,
          jumlahBayar,
          bankAsal,
          bankTujuan,
          namaPenerima,
          alamatPengiriman,
        },
        { where: { id: req.params.transaksiId } }
      );
      return res.status(200).json({ message: `success editing transaksi` });
    } catch (error) {
      return res.status(400).json(error);
    }
  };

  // CMS

  static getAllTransaksi = async (req, res) => {
    const data = await Transaksi.findAll({
      include: { model: Cart, include: [Produk, User] },
    });
    return res.status(200).json(data);
  };

  static konfirmasiTransaksi = async (req, res) => {
    const {
      Carts,
      id,
      statusPembayaran,
      statusPengiriman,
      statusPesanan,
      totalHarga,
      ongkosKirim,
      referralCode,
    } = req.body;

    // if (referralCode !== null) {
    //   const userData = await User.findOne({
    //     where: { referral: referralCode },
    //   });
    //   const komisiData = await Komisi.findOne({
    //     where: { userId: userData.id },
    //   });

    //   if (userData.referralStatus) {
    //     const addNewTransaksiKomisi = await TransaksiKomisi.create({
    //       komisiId: komisiData.id,
    //       userId: Carts[0].userId,
    //       nominal: (totalHarga - ongkosKirim) * 0.1,
    //       transaksiId: id,
    //     });

    //     const getUserKomisiData = await Komisi.findOne({
    //       where: { userId: userData.id },
    //     });

    //     getUserKomisiData.totalKomisi =
    //       getUserKomisiData.totalKomisi +
    //       Number(totalHarga - ongkosKirim) * 0.1;
    //     if (getUserKomisiData.sisaKomisi === 0) {
    //       getUserKomisiData.sisaKomisi = getUserKomisiData.totalKomisi;
    //     } else {
    //       getUserKomisiData.sisaKomisi +=
    //         Number(totalHarga - ongkosKirim) * 0.1;
    //     }

    //     const addTotalKomisi = await Komisi.update(
    //       getUserKomisiData.dataValues,
    //       {
    //         where: { userId: userData.id },
    //       }
    //     );
    //   }
    // }
    const konfirmasi = await Transaksi.update(
      { id, statusPembayaran, statusPengiriman, statusPesanan },
      { where: { id } }
    );

    const customerData = await User.findOne({ where: { id: Carts[0].userId } });
    customerData.totalPembelian += totalHarga - ongkosKirim;
    const update = await User.update(
      { totalPembelian: customerData.totalPembelian },
      {
        where: { id: customerData.id },
      }
    );
    return res.status(200).json({ message: "success" });
  };

  static tolakPesanan = async (req, res) => {
    const {
      Carts,
      alamatPengiriman,
      bankAsal,
      bankTujuan,
      id,
      invoice,
      jumlahBayar,
      metodePembayaran,
      namaPenerima,
      namaRekening,
      ongkosKirim,
      referralCode,
      statusPembayaran,
      statusPengiriman,
      statusPesanan,
      telfonPenerima,
      totalHarga,
    } = req.body;
    const data = await Transaksi.update(
      {
        alamatPengiriman,
        bankAsal,
        bankTujuan,
        id,
        invoice,
        jumlahBayar,
        metodePembayaran,
        namaPenerima,
        namaRekening,
        ongkosKirim,
        referralCode,
        statusPembayaran,
        statusPengiriman,
        statusPesanan,
        telfonPenerima,
        totalHarga,
      },
      { where: { id } }
    );
    const promiseGetProdukData = [];
    const produk = [];
    Carts.map((cart) => {
      produk.push({ qty: cart.qty, produkId: cart.produkId });
      promiseGetProdukData.push(
        Produk.findOne({ where: { id: cart.produkId } })
      );
    });
    const produkData = await Promise.all(promiseGetProdukData);
    const promiseEditProduk = [];
    produkData.map((item) => {
      produk.map((el) => {
        if (item.id === el.produkId) {
          item.stock += el.qty;
          promiseEditProduk.push(
            Produk.update(item.dataValues, { where: { id: item.id } })
          );
        }
      });
    });
    const editedProduk = await Promise.all(promiseEditProduk);

    return res.status(200).json({ message: "success" });
  };

  static updateResi = async (req, res) => {
    const { noResi, statusPengiriman, id, expiredAt } = req.body;
    const data = await Transaksi.update(
      { noResi, statusPengiriman, expiredAt },
      { where: { id } }
    );
    return res.status(200).json({ message: "success" });
  };

  static ubahStatusPembayaran = async (req, res) => {
    const { statusPembayaran, id } = req.body;
    console.log(statusPembayaran, id);
    const transaksi = await Transaksi.update(
      { statusPembayaran },
      { where: { id } }
    );
    console.log(transaksi);
    return res.status(200).json({ messsage: "success" });
  };

  static pesananSelesai = async (req, res) => {
    const {
      Carts,
      id,
      statusPengiriman,
      statusPesanan,
      totalHarga,
      ongkosKirim,
      referralCode,
    } = req.body;
    if (referralCode !== null) {
      const userData = await User.findOne({
        where: { referral: referralCode },
      });
      const komisiData = await Komisi.findOne({
        where: { userId: userData.id },
      });

      if (userData.referralStatus) {
        const addNewTransaksiKomisi = await TransaksiKomisi.create({
          komisiId: komisiData.id,
          userId: Carts[0].userId,
          nominal: (totalHarga - ongkosKirim) * 0.1,
          transaksiId: id,
        });

        const getUserKomisiData = await Komisi.findOne({
          where: { userId: userData.id },
        });

        getUserKomisiData.totalKomisi =
          getUserKomisiData.totalKomisi +
          Number(totalHarga - ongkosKirim) * 0.1;
        if (getUserKomisiData.sisaKomisi === 0) {
          getUserKomisiData.sisaKomisi = getUserKomisiData.totalKomisi;
        } else {
          getUserKomisiData.sisaKomisi +=
            Number(totalHarga - ongkosKirim) * 0.1;
        }

        const addTotalKomisi = await Komisi.update(
          getUserKomisiData.dataValues,
          {
            where: { userId: userData.id },
          }
        );
      }
    }
    const data = await Transaksi.update(
      { statusPengiriman, statusPesanan },
      { where: { id } }
    );
    return res.status(200).json({ message: "success" });
  };
}

module.exports = Controller;
