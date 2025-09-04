export default function Header({ orderCount, onUpdateOrderCount }) {
  return (
    <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">FutureProof</h1>
      <div>
        <span className="mr-4">Orders: {orderCount}</span>
        <button className="bg-blue-500 px-3 py-1 rounded" onClick={onUpdateOrderCount}>
          Refresh Orders
        </button>
      </div>
    </header>
  );
}
