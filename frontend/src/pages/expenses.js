export function renderExpenses() {
  return `
    <section class="module expenses">
      <h2>Gastos y Deducciones</h2>
      <button id="new-expense" type="button">Anadir gasto</button>
      <div id="expense-list"></div>
    </section>
  `;
}

export default renderExpenses;
