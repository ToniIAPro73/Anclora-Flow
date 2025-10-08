export function renderInvoices() {
  return `
    <section class="module invoices">
      <h2>Ingresos y Facturas</h2>
      <button id="new-invoice" type="button">Nueva factura</button>
      <div id="invoice-list"></div>
    </section>
  `;
}

export default renderInvoices;
