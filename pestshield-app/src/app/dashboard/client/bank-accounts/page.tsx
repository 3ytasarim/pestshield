import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { BankAccountsPage } from "@/components/finance/bank-accounts-page";
import { serializeBankAccount, serializeBankTransaction } from "@/lib/finance/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [accounts, transactions] = await Promise.all([
    prisma.bankAccount.findMany({ where: { ownerId }, orderBy: { bankName: "asc" } }),
    prisma.bankTransaction.findMany({ where: { ownerId }, orderBy: { date: "desc" } }),
  ]);

  return (
    <BankAccountsPage
      initialAccounts={accounts.map(serializeBankAccount)}
      initialTransactions={transactions.map(serializeBankTransaction)}
    />
  );
}
